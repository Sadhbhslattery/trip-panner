/**
 * Seed Unit Test (Rubric: Testing — 1 of 3 required tests)
 * 
 * Verifies that seedIfEmpty() correctly inserts sample data into all core tables without duplication or errors.
 *
 * Strategy:
 * - Mock the Drizzle db module so we don't hit a real SQLite database during the test (Jest can't open native SQLite, and we don't want test pollution).
 * - Record every db.insert().values() call into a mockInsertCalls array.
 * - mockUsersCount grows as users get inserted, so the "is empty" check (used by seedIfEmpty to decide whether to seed) behaves realistically
 * across multiple seed runs — essential for the idempotency test below.
 *
 * Three assertions:
 * 1. All six core tables receive at least one insert
 * 2. The insert volumes match the expected seed (1 user, 3 trips, 8 cats, over 20 activities, 3 targets, over 20 guests)
 * 3. Running seedIfEmpty twice does NOT insert anything a second time (this is the idempotency guarantee that lets us call it on every
 * app launch safely)
 *
 */

import { seedIfEmpty } from '@/db/seed';

type InsertCall = { table: { __name: string }; values: any[] };
const mockInsertCalls: InsertCall[] = [];
let mockUsersCount = 0;

// Mock the Drizzle client. `select().from(users)` returns a fake-populated array only after users have been inserted — this lets the idempotency
// guard inside seedIfEmpty behave correctly in tests.
jest.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: (table: { __name: string }) => {
        if (table.__name === 'users') {
          return Promise.resolve(Array(mockUsersCount).fill({}));
        }
        return Promise.resolve([]);
      },
    }),
    insert: (table: { __name: string }) => ({
      values: (data: any | any[]) => {
        const rows = Array.isArray(data) ? data : [data];
        mockInsertCalls.push({ table, values: rows });
        if (table.__name === 'users') mockUsersCount += rows.length;
        return Promise.resolve();
      },
    }),
  },
}));

// Mock the schema module: each table becomes a tagged object so the mock db above can identify which table is being written to
jest.mock('@/db/schema', () => ({
  users: { __name: 'users' },
  trips: { __name: 'trips' },
  categories: { __name: 'categories' },
  activities: { __name: 'activities' },
  targets: { __name: 'targets' },
  guests: { __name: 'guests' },
}));

describe('seedIfEmpty', () => {
  // Reset shared state between tests so each runs in isolation
  beforeEach(() => {
    mockInsertCalls.length = 0;
    mockUsersCount = 0;
  });

  it('inserts data into all six core tables', async () => {
    await seedIfEmpty();
    const tablesTouched = new Set(mockInsertCalls.map((c) => c.table.__name));
    expect(tablesTouched.has('users')).toBe(true);
    expect(tablesTouched.has('trips')).toBe(true);
    expect(tablesTouched.has('categories')).toBe(true);
    expect(tablesTouched.has('activities')).toBe(true);
    expect(tablesTouched.has('targets')).toBe(true);
    expect(tablesTouched.has('guests')).toBe(true);
  });

  it('seeds the expected volume of sample data', async () => {
    await seedIfEmpty();
    // Helper: sum every row inserted for a given table name
    const countFor = (name: string) =>
      mockInsertCalls
        .filter((c) => c.table.__name === name)
        .reduce((sum, c) => sum + c.values.length, 0);

    expect(countFor('users')).toBe(1);
    expect(countFor('trips')).toBe(3);
    expect(countFor('categories')).toBe(8);
    expect(countFor('activities')).toBeGreaterThan(20);
    expect(countFor('targets')).toBe(3);
    expect(countFor('guests')).toBeGreaterThan(20);
  });

  it('does not duplicate data when run a second time', async () => {
    await seedIfEmpty();
    const firstRunCallCount = mockInsertCalls.length;
    // Second invocation should short-circuit on the empty-users guard
    await seedIfEmpty();
    expect(mockInsertCalls.length).toBe(firstRunCallCount);
  });
});