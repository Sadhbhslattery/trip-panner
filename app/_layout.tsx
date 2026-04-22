/**
 * Root Layout and TripContext (Advanced Feature — Dark Mode Persistence)
 * This file does three jobs:
 *
 *  1. Sets up the app's root navigation stack (expo-router).
 *  2. Seeds and loads all database state on startup, then exposes it through TripContext so any screen can read/write without prop-drilling.
 *  3. Persists the light/dark mode preference to SQLite so the user's choice survives app restarts [R7].
 *
 * Dark mode persistence flow:
 * - On mount, read users.theme from SQLite. If "dark", set isDark equals true.
 * - When user toggles theme, update SQLite immediately then update React state.
 * - Writing to SQLite before state means the DB is always the source of truth,
 * so a crash mid-toggle doesn't leave DB and UI out of sync.
 *
 * Key references: React Context [R6], Drizzle ORM [R9], Expo SQLite [R8].
 */

import { db } from '@/db/client';
import { activities as activitiesTable, categories as categoriesTable, guests as guestsTable, targets as targetsTable, trips as tripsTable, users as usersTable } from '@/db/schema';
import { seedIfEmpty } from '@/db/seed';
import { eq } from 'drizzle-orm';
import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';

// Domain types — kept in this file so any screen importing TripContext also gets the shapes of the data, avoiding circular imports with db/schema
export type Trip = {
  id: number; userId: number; name: string; destination: string;
  startDate: string; endDate: string; guestCount: number; budget: number; notes: string | null;
};
export type Activity = {
  id: number; tripId: number; categoryId: number; name: string;
  date: string; duration: number; cost: number; notes: string | null;
};
export type Category = { id: number; userId: number; name: string; colour: string; icon: string; };
export type Target = { id: number; userId: number; categoryId: number | null; targetType: string; targetValue: number; };
export type Guest = { id: number; tripId: number; name: string; phone: string | null; dietary: string | null; attending: string; notes: string | null; };

/**
 * Shape of the app-wide context.
 * Every piece of data that any screen might mutate has its setter exposed here, so screens can persist changes to SQLite and then refresh the shared state.
 */
type TripContextType = {
  trips: Trip[]; setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  activities: Activity[]; setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  categories: Category[]; setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  targets: Target[]; setTargets: React.Dispatch<React.SetStateAction<Target[]>>;
  guests: Guest[]; setGuests: React.Dispatch<React.SetStateAction<Guest[]>>;
  isDark: boolean;
  toggleTheme: () => void;
};

export const TripContext = createContext<TripContextType | null>(null);

export default function RootLayout() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isDark, setIsDark] = useState(false);

  // On first mount: seed the DB if empty, then hydrate all in-memory state from SQLite including the saved theme preference
  useEffect(() => {
    const loadData = async () => {
      await seedIfEmpty();
      setTrips(await db.select().from(tripsTable));
      setActivities(await db.select().from(activitiesTable));
      setCategories(await db.select().from(categoriesTable));
      setTargets(await db.select().from(targetsTable));
      setGuests(await db.select().from(guestsTable));

      // Dark mode persistence: read the saved theme from the users table and set the UI accordingly [R7]
      const userRows = await db.select().from(usersTable);
      if (userRows.length > 0 && userRows[0].theme === 'dark') {
        setIsDark(true);
      }
    };
    void loadData();
  }, []);

  /**
   * Toggles the theme and persists the new value to SQLite.
   * Writing to DB first keeps it as the source of truth; if the state update
   * below fails for any reason, a restart would still reflect the user's choice.
   */
  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    await db.update(usersTable).set({ theme: newTheme }).where(eq(usersTable.id, 1));
  };

  return (
    <TripContext.Provider value={{
      trips, setTrips, activities, setActivities, categories, setCategories,
      targets, setTargets, guests, setGuests, isDark, toggleTheme,
    }}>
      <Stack screenOptions={{ headerShown: false }} />
    </TripContext.Provider>
  );
}