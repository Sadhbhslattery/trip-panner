import { db } from './client';
import { users, trips, categories, activities, targets } from './schema';

export async function seedIfEmpty() {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) return;

  await db.insert(users).values([
    { id: 1, username: 'demo', password: 'password123' },
  ]);

  // Hen party categories
  await db.insert(categories).values([
    { id: 1, userId: 1, name: 'Drinks', colour: '#D4537E', icon: '🍹' },
    { id: 2, userId: 1, name: 'Pampering', colour: '#C084FC', icon: '💅' },
    { id: 3, userId: 1, name: 'Food', colour: '#F59E0B', icon: '🍽️' },
    { id: 4, userId: 1, name: 'Games', colour: '#34D399', icon: '🎲' },
    { id: 5, userId: 1, name: 'Nightlife', colour: '#818CF8', icon: '💃' },
    { id: 6, userId: 1, name: 'Activities', colour: '#F97316', icon: '🎨' },
    { id: 7, userId: 1, name: 'Transport', colour: '#64748B', icon: '🚐' },
    { id: 8, userId: 1, name: 'Accommodation', colour: '#0EA5E9', icon: '🏨' },
  ]);

  // Hen 1: Galway weekend
  await db.insert(trips).values([
    {
      id: 1,
      userId: 1,
      name: 'Sarah\'s Hen - Galway',
      destination: 'Galway, Ireland',
      startDate: '2025-07-18',
      endDate: '2025-07-20',
      guestCount: 12,
      budget: 3500,
      notes: 'Bride: Sarah. Theme: pink & gold. Sarah doesn\'t know about the life drawing class - keep it a surprise!',
    },
  ]);

  await db.insert(activities).values([
    { tripId: 1, categoryId: 8, name: 'Airbnb - Salthill house', date: '2025-07-18', duration: 0, cost: 850, notes: '4 bed house, fits everyone if we double up' },
    { tripId: 1, categoryId: 7, name: 'Bus hire Cork to Galway', date: '2025-07-18', duration: 180, cost: 320, notes: 'Pickup 10am from Patrick St' },
    { tripId: 1, categoryId: 1, name: 'Afternoon tea & prosecco', date: '2025-07-18', duration: 120, cost: 360, notes: 'The g Hotel, booked for 12' },
    { tripId: 1, categoryId: 4, name: 'Hen party games at the house', date: '2025-07-18', duration: 90, cost: 25, notes: 'Mr & Mrs quiz, dare cards - Amy has the props' },
    { tripId: 1, categoryId: 3, name: 'Dinner at Kai', date: '2025-07-18', duration: 120, cost: 480, notes: 'Reservation under Ciara\'s name, 7:30pm' },
    { tripId: 1, categoryId: 5, name: 'Night out - Latin Quarter', date: '2025-07-18', duration: 240, cost: 0, notes: 'Start at Tigh Neachtain, then Roisin Dubh' },
    { tripId: 1, categoryId: 2, name: 'Morning yoga on the beach', date: '2025-07-19', duration: 60, cost: 120, notes: 'Instructor booked for Salthill beach, 9am' },
    { tripId: 1, categoryId: 6, name: 'Life drawing class', date: '2025-07-19', duration: 120, cost: 300, notes: 'SURPRISE for Sarah!! Studio on Quay St' },
    { tripId: 1, categoryId: 1, name: 'Cocktail making class', date: '2025-07-19', duration: 90, cost: 360, notes: 'At the house - mobile bar coming to us' },
    { tripId: 1, categoryId: 3, name: 'Pizzas delivered', date: '2025-07-19', duration: 60, cost: 180, notes: 'Dough Bros, order by 6pm' },
    { tripId: 1, categoryId: 4, name: 'Bride-to-be bingo', date: '2025-07-19', duration: 60, cost: 15, notes: 'Print cards beforehand, winner gets a bottle' },
    { tripId: 1, categoryId: 3, name: 'Brunch before heading home', date: '2025-07-20', duration: 90, cost: 240, notes: 'Ard Bia at Nimmos, 11am' },
  ]);

  // Hen 2: Killarney
  await db.insert(trips).values([
    {
      id: 2,
      userId: 1,
      name: 'Aoife\'s Hen - Killarney',
      destination: 'Killarney, Kerry',
      startDate: '2025-08-22',
      endDate: '2025-08-24',
      guestCount: 8,
      budget: 2000,
      notes: 'Bride: Aoife. Smaller group, she wants something chilled. No L-plates - she was very clear about that!',
    },
  ]);

  await db.insert(activities).values([
    { tripId: 2, categoryId: 8, name: 'The Brehon Hotel - 2 rooms', date: '2025-08-22', duration: 0, cost: 520, notes: '2 nights, 4 per room' },
    { tripId: 2, categoryId: 2, name: 'Spa afternoon at the Brehon', date: '2025-08-22', duration: 180, cost: 640, notes: 'Vitality pool, treatments, robes - the works' },
    { tripId: 2, categoryId: 3, name: 'Dinner at Bricin', date: '2025-08-22', duration: 120, cost: 320, notes: 'Known for their boxty, book early' },
    { tripId: 2, categoryId: 1, name: 'Drinks at Courtney\'s Bar', date: '2025-08-22', duration: 120, cost: 0, notes: 'No booking needed, lovely little spot' },
    { tripId: 2, categoryId: 6, name: 'Jaunting car tour through the park', date: '2025-08-23', duration: 90, cost: 240, notes: '2 jaunting cars, pick up outside hotel' },
    { tripId: 2, categoryId: 6, name: 'Boat trip to Innisfallen Island', date: '2025-08-23', duration: 120, cost: 160, notes: 'Book through hotel concierge' },
    { tripId: 2, categoryId: 3, name: 'Lunch at The Laurels', date: '2025-08-23', duration: 90, cost: 200, notes: null },
    { tripId: 2, categoryId: 4, name: 'Wine & cheese night at hotel', date: '2025-08-23', duration: 120, cost: 120, notes: 'Bring the games, hotel provides the cheese board' },
  ]);

  // Hen 3: future one being planned
  await db.insert(trips).values([
    {
      id: 3,
      userId: 1,
      name: 'Emma\'s Hen - Lisbon',
      destination: 'Lisbon, Portugal',
      startDate: '2025-09-12',
      endDate: '2025-09-15',
      guestCount: 14,
      budget: 5000,
      notes: 'Bride: Emma. Big group, mix of Irish and UK girls. Some only coming for 2 of the 3 nights. Need to figure out cost split.',
    },
  ]);

  await db.insert(activities).values([
    { tripId: 3, categoryId: 8, name: 'Airbnb apartment in Bairro Alto', date: '2025-09-12', duration: 0, cost: 1200, notes: 'Big apartment, sleeps 14 across 5 rooms' },
    { tripId: 3, categoryId: 6, name: 'Tile painting workshop', date: '2025-09-12', duration: 120, cost: 350, notes: 'Everyone makes their own azulejo tile' },
    { tripId: 3, categoryId: 3, name: 'Group dinner at Cervejaria Ramiro', date: '2025-09-12', duration: 120, cost: 560, notes: 'Seafood, the prawns are unreal' },
    { tripId: 3, categoryId: 5, name: 'Bar crawl in Bairro Alto', date: '2025-09-12', duration: 180, cost: 0, notes: 'No plan needed, just wander' },
    { tripId: 3, categoryId: 6, name: 'Beach day at Cascais', date: '2025-09-13', duration: 300, cost: 50, notes: 'Train from Cais do Sodre, 40 min each way' },
    { tripId: 3, categoryId: 1, name: 'Rooftop bar sunset drinks', date: '2025-09-13', duration: 120, cost: 0, notes: 'Park Bar or TOPO - get there early for seats' },
    { tripId: 3, categoryId: 2, name: 'Group massage at the apartment', date: '2025-09-14', duration: 120, cost: 700, notes: 'Mobile masseuse, 2 therapists for 14 people' },
    { tripId: 3, categoryId: 1, name: 'Wine tasting', date: '2025-09-14', duration: 90, cost: 420, notes: 'Portuguese wines, Alfama area' },
    { tripId: 3, categoryId: 3, name: 'Last supper - Time Out Market', date: '2025-09-14', duration: 120, cost: 350, notes: 'Everyone picks their own stall' },
  ]);

  // Targets
  await db.insert(targets).values([
    { userId: 1, categoryId: 3, targetType: 'weekly', targetValue: 3 },
    { userId: 1, categoryId: 6, targetType: 'weekly', targetValue: 2 },
    { userId: 1, categoryId: null, targetType: 'monthly', targetValue: 15 },
  ]);
}
