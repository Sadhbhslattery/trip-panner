import { seedIfEmpty } from '@/db/seed';

type InsertCall = { table: { __name: string }; values: any[] };
const mockInsertCalls: InsertCall[] = [];
let mockUsersCount = 0;

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

jest.mock('@/db/schema', () => ({
  users: { __name: 'users' },
  trips: { __name: 'trips' },
  categories: { __name: 'categories' },
  activities: { __name: 'activities' },
  targets: { __name: 'targets' },
  guests: { __name: 'guests' },
}));

describe('seedIfEmpty', () => {
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
    await seedIfEmpty();
    expect(mockInsertCalls.length).toBe(firstRunCallCount);
  });
});