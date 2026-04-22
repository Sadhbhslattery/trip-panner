/**
 * Drizzle ORM Schema — SQLite Tables
 * 
 * Defines the shape of all six tables in the local SQLite database [R9].
 * Drizzle uses these table definitions both as TypeScript types and as the schema the migrations are generated from.
 *
 * Six tables mirror the rubric's data model (adapted for a hen party planner):
 * - users — authentication and theme preference (for dark mode persistence)
 * - trips — the "primary record" (each hen party equals one trip)
 * - categories — user-owned tags with colour and emoji icon because emojis are fun.
 * - activities — individual items within a trip (e.g. "Dinner at Kai")
 * - targets — weekly/monthly goals, either global or category-scoped
 * - guests — attendee list per trip (domain-specific addition for hens)
 *
 * Notes on design:
 * - Foreign keys are stored as plain integers. Drizzle doesn't enforce FK constraints at the schema level for SQLite by default, but CASCADE
 * deletes are handled explicitly in the delete flows (e.g. deleting a trip also deletes its activities).
 * - All timestamps are stored as ISO date strings (YYYY-MM-DD) for simplicity and easy sorting via localeCompare.
 * - targets.categoryId is nullable — null means "global" (applies to all activities regardless of category).
 *
 * Reference: Drizzle ORM SQLite docs [R9].
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Users table — stores credentials and UI preferences
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  password: text('password').notNull(),
  // Theme is persisted here so dark mode survives app restarts [R7]
  theme: text('theme').notNull().default('light'),
});

// Trips — each row is one hen party
export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  // ISO date strings (YYYY-MM-DD). Stored as text for portability
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  guestCount: integer('guest_count').notNull().default(1),
  budget: integer('budget').notNull().default(0),
  notes: text('notes'),
});

// Categories — user-owned tags (e.g. Drinks, Pampering, Food)
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  colour: text('colour').notNull(), // hex string, e.g. "#D4537E"
  icon: text('icon').notNull(), // single emoji, e.g. "🍹"
});

// Activities — line items within a trip
export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id').notNull(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  // "Metric" per the rubric — for hens, duration (mins) and cost (€) are both tracked so insights can aggregate by either
  duration: integer('duration').notNull().default(0),
  cost: integer('cost').notNull().default(0),
  notes: text('notes'),
});

// Targets — weekly or monthly activity goals
export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  // Nullable = global target across every category
  categoryId: integer('category_id'),
  targetType: text('target_type').notNull(), // weekly | monthly
  targetValue: integer('target_value').notNull(),
});

// Guests — attendee list for each trip (hen-specific domain table)
export const guests = sqliteTable('guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  dietary: text('dietary'),
  attending: text('attending').notNull().default('full'), // full | partial | unsure
  notes: text('notes'),
});