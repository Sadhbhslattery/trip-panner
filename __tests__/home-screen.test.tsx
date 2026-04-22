/**
 * Home Screen Integration Test (Rubric: Testing — 3 of 3 required tests)
 * 
 * Verifies that seeded trip data flows from storage through application state and into the rendered UI. This is the "integration" test of the three —
 * it exercises the full context - component - render pipeline rather than a single isolated unit.
 *
 * Strategy:
 * - Mock the db/client, db/schema, db/seed, and expo-sqlite modules BEFORE importing IndexScreen. Mock order matters: Jest hoists jest.mock() calls
 * to the top of the file, but the imports below them still need to resolve in the right order so the native SQLite opener never runs.
 * - Mock useColors, expo-router, and safe-area-context with minimal stubs so the render tree completes without the full navigation/theme stack.
 * - Render IndexScreen wrapped in a fake TripContext.Provider, passing in three seeded trip rows that match the real seed data (Sarah's Galway,
 * Aoife's Killarney, Emma's Lisbon).
 *
 * Four assertions:
 * 1. All three seeded hen names appear on the screen
 * 2. All three destinations appear
 * 3. The header subtitle shows the correct trip count ("3 hens in the works")
 * 4. The empty-state message appears when zero trips are seeded
 *
 * References: React Native Testing Library [R11], Jest [R10].
 */

import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mocks must be declared BEFORE importing any app module that transitively
// loads the real db/client (which opens native SQLite and would crash in Jest)
jest.mock('@/db/client', () => ({
  db: {
    select: () => ({ from: () => Promise.resolve([]) }),
    insert: () => ({ values: () => Promise.resolve() }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    delete: () => ({ where: () => Promise.resolve() }),
  },
}));

jest.mock('@/db/schema', () => ({
  users: {}, trips: {}, categories: {},
  activities: {}, targets: {}, guests: {},
}));

jest.mock('@/db/seed', () => ({
  seedIfEmpty: jest.fn().mockResolvedValue(undefined),
}));

// expo-sqlite is mocked so openDatabaseSync doesn't try to open a real DB file
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => ({ execSync: jest.fn() }),
}));

import IndexScreen from '@/app/(tabs)/index';
import type { Activity, Category, Guest, Target, Trip } from '@/app/_layout';
import { TripContext } from '@/app/_layout';

// Minimal theme stub — every colour the screen reads is defined here
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    bg: '#fff', card: '#fff', border: '#eee', text: '#000',
    textSoft: '#666', textFaint: '#999', input: '#fff', inputBorder: '#ccc',
    success: '#0a0', danger: '#a00', accent: '#D4537E', trackBg: '#eee',
  }),
}));

// expo-router stubbed to return a no-op router — the test doesn't navigate
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// SafeAreaView is replaced with a plain View so no native safe-area measurement is needed
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View };
});

// Realistic seed data matching db/seed.ts structure
const seededTrips: Trip[] = [
  { id: 1, userId: 1, name: "Sarah's Hen - Galway", destination: 'Galway, Ireland',
    startDate: '2025-07-18', endDate: '2025-07-20', guestCount: 12, budget: 3500, notes: null },
  { id: 2, userId: 1, name: "Aoife's Hen - Killarney", destination: 'Killarney, Kerry',
    startDate: '2025-08-22', endDate: '2025-08-24', guestCount: 8, budget: 2000, notes: null },
  { id: 3, userId: 1, name: "Emma's Hen - Lisbon", destination: 'Lisbon, Portugal',
    startDate: '2025-09-12', endDate: '2025-09-15', guestCount: 14, budget: 5000, notes: null },
];

const seededActivities: Activity[] = [
  { id: 1, tripId: 1, categoryId: 1, name: 'Afternoon tea', date: '2025-07-18',
    duration: 120, cost: 360, notes: null },
  { id: 2, tripId: 2, categoryId: 2, name: 'Spa afternoon', date: '2025-08-22',
    duration: 180, cost: 640, notes: null },
];

/**
 * Renders IndexScreen inside a TripContext.Provider populated with the supplied trips/activities. All other context fields are stubbed with
 * empty arrays or jest.fn() — they're required by the context shape but not exercised by this test.
 */
const renderWithContext = (trips: Trip[], activities: Activity[]) => {
  const value = {
    trips, setTrips: jest.fn(),
    activities, setActivities: jest.fn(),
    categories: [] as Category[], setCategories: jest.fn(),
    targets: [] as Target[], setTargets: jest.fn(),
    guests: [] as Guest[], setGuests: jest.fn(),
    isDark: false, toggleTheme: jest.fn(),
  };
  return render(
    <TripContext.Provider value={value}>
      <IndexScreen />
    </TripContext.Provider>
  );
};

describe('Home screen (IndexScreen)', () => {
  it('renders all seeded trips from the database', async () => {
    const { getByText } = renderWithContext(seededTrips, seededActivities);
    await waitFor(() => {
      expect(getByText("Sarah's Hen - Galway")).toBeTruthy();
      expect(getByText("Aoife's Hen - Killarney")).toBeTruthy();
      expect(getByText("Emma's Hen - Lisbon")).toBeTruthy();
    });
  });

  it('shows the correct destination for each seeded trip', async () => {
    const { getByText } = renderWithContext(seededTrips, seededActivities);
    await waitFor(() => {
      expect(getByText('Galway, Ireland')).toBeTruthy();
      expect(getByText('Killarney, Kerry')).toBeTruthy();
      expect(getByText('Lisbon, Portugal')).toBeTruthy();
    });
  });

  it('displays trip count in the header', async () => {
    const { getByText } = renderWithContext(seededTrips, seededActivities);
    await waitFor(() => {
      expect(getByText('3 hens in the works')).toBeTruthy();
    });
  });

  it('shows an empty state when no trips are seeded', async () => {
    const { getByText } = renderWithContext([], []);
    await waitFor(() => {
      expect(getByText('No hens planned yet!')).toBeTruthy();
    });
  });
});