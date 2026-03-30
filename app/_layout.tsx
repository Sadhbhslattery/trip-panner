import { db } from '@/db/client';
import { activities as activitiesTable, categories as categoriesTable, guests as guestsTable, targets as targetsTable, trips as tripsTable, users as usersTable } from '@/db/schema';
import { seedIfEmpty } from '@/db/seed';
import { eq } from 'drizzle-orm';
import { Stack } from 'expo-router';
import { createContext, useEffect, useState } from 'react';

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

  useEffect(() => {
    const loadData = async () => {
      await seedIfEmpty();
      setTrips(await db.select().from(tripsTable));
      setActivities(await db.select().from(activitiesTable));
      setCategories(await db.select().from(categoriesTable));
      setTargets(await db.select().from(targetsTable));
      setGuests(await db.select().from(guestsTable));

      const userRows = await db.select().from(usersTable);
      if (userRows.length > 0 && userRows[0].theme === 'dark') {
        setIsDark(true);
      }
    };
    void loadData();
  }, []);

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
