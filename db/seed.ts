import { db } from './client';
import { activities, categories, targets, trips, users } from './schema';

export async function seedIfEmpty() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  // Default user so the app has data on first launch
  await db.insert(users).values([
    { id: 1, username: 'demo', password: 'password123' },
  ]);

  // Categories with colours and icons
  await db.insert(categories).values([
    { id: 1, userId: 1, name: 'Sightseeing', colour: '#E8593C', icon: '🏛️' },
    { id: 2, userId: 1, name: 'Outdoor', colour: '#2E9E6B', icon: '🥾' },
    { id: 3, userId: 1, name: 'Food & Drink', colour: '#D4853A', icon: '🍽️' },
    { id: 4, userId: 1, name: 'Nightlife', colour: '#7B5CC3', icon: '🎶' },
    { id: 5, userId: 1, name: 'Shopping', colour: '#3B8BD4', icon: '🛍️' },
    { id: 6, userId: 1, name: 'Relaxation', colour: '#D4537E', icon: '🧘' },
  ]);

  // Trip 1: Lisbon
  await db.insert(trips).values([
    {
      id: 1,
      userId: 1,
      name: 'Lisbon Long Weekend',
      destination: 'Lisbon, Portugal',
      startDate: '2025-06-12',
      endDate: '2025-06-16',
      notes: 'Flights with Ryanair, staying near Bairro Alto',
    },
  ]);

  await db.insert(activities).values([
    { tripId: 1, categoryId: 1, name: 'Belém Tower', date: '2025-06-12', duration: 90, notes: 'Book tickets online' },
    { tripId: 1, categoryId: 1, name: 'Jerónimos Monastery', date: '2025-06-12', duration: 120, notes: null },
    { tripId: 1, categoryId: 3, name: 'Pastéis de Belém', date: '2025-06-12', duration: 45, notes: 'Try the pastel de nata' },
    { tripId: 1, categoryId: 2, name: 'Hike to Castelo de São Jorge', date: '2025-06-13', duration: 150, notes: 'Wear good shoes, steep climb' },
    { tripId: 1, categoryId: 3, name: 'Time Out Market', date: '2025-06-13', duration: 90, notes: 'Lunch spot' },
    { tripId: 1, categoryId: 4, name: 'Bairro Alto bar crawl', date: '2025-06-13', duration: 180, notes: null },
    { tripId: 1, categoryId: 1, name: 'Tram 28 ride', date: '2025-06-14', duration: 60, notes: 'Go early to avoid queues' },
    { tripId: 1, categoryId: 5, name: 'LX Factory', date: '2025-06-14', duration: 120, notes: 'Cool shops and street art' },
    { tripId: 1, categoryId: 6, name: 'Beach at Cascais', date: '2025-06-15', duration: 300, notes: 'Train from Cais do Sodré, 40 min' },
    { tripId: 1, categoryId: 3, name: 'Cervejaria Ramiro', date: '2025-06-15', duration: 90, notes: 'Seafood, get the prawns' },
  ]);

  // Trip 2: West Cork
  await db.insert(trips).values([
    {
      id: 2,
      userId: 1,
      name: 'West Cork Road Trip',
      destination: 'West Cork, Ireland',
      startDate: '2025-07-20',
      endDate: '2025-07-24',
      notes: 'Driving from Cork city, staying in Clonakilty',
    },
  ]);

  await db.insert(activities).values([
    { tripId: 2, categoryId: 2, name: 'Inchydoney Beach walk', date: '2025-07-20', duration: 90, notes: null },
    { tripId: 2, categoryId: 3, name: 'Deasy\'s Harbour Bar', date: '2025-07-20', duration: 120, notes: 'Ring, great fish' },
    { tripId: 2, categoryId: 2, name: 'Drombeg Stone Circle', date: '2025-07-21', duration: 60, notes: null },
    { tripId: 2, categoryId: 1, name: 'Michael Collins House Museum', date: '2025-07-21', duration: 90, notes: 'In Clonakilty' },
    { tripId: 2, categoryId: 2, name: 'Kayaking in Lough Hyne', date: '2025-07-22', duration: 180, notes: 'Book with Atlantic Sea Kayaking' },
    { tripId: 2, categoryId: 3, name: 'Budds of Ballydehob', date: '2025-07-22', duration: 60, notes: 'Ice cream stop' },
    { tripId: 2, categoryId: 1, name: 'Mizen Head Signal Station', date: '2025-07-23', duration: 120, notes: 'Ireland\'s most south-westerly point' },
    { tripId: 2, categoryId: 6, name: 'Barleycove Beach', date: '2025-07-23', duration: 240, notes: 'Bring a windbreak' },
  ]);

  // Trip 3: future trip (shows upcoming in the app)
  await db.insert(trips).values([
    {
      id: 3,
      userId: 1,
      name: 'Edinburgh Fringe',
      destination: 'Edinburgh, Scotland',
      startDate: '2025-08-08',
      endDate: '2025-08-12',
      notes: 'Festival season, book accommodation early',
    },
  ]);

  await db.insert(activities).values([
    { tripId: 3, categoryId: 4, name: 'Comedy show at Pleasance', date: '2025-08-08', duration: 90, notes: 'Check programme closer to date' },
    { tripId: 3, categoryId: 1, name: 'Edinburgh Castle', date: '2025-08-09', duration: 150, notes: null },
    { tripId: 3, categoryId: 2, name: 'Arthur\'s Seat hike', date: '2025-08-09', duration: 120, notes: null },
    { tripId: 3, categoryId: 3, name: 'Whisky tasting on Royal Mile', date: '2025-08-10', duration: 90, notes: null },
    { tripId: 3, categoryId: 5, name: 'Victoria Street shops', date: '2025-08-10', duration: 60, notes: 'The colourful street' },
    { tripId: 3, categoryId: 4, name: 'Street performers on the Mile', date: '2025-08-11', duration: 120, notes: 'Free but bring cash for tips' },
  ]);

  // Targets
  await db.insert(targets).values([
    { userId: 1, categoryId: 2, targetType: 'weekly', targetValue: 3 },
    { userId: 1, categoryId: 3, targetType: 'weekly', targetValue: 5 },
    { userId: 1, categoryId: null, targetType: 'monthly', targetValue: 20 },
  ]);
}