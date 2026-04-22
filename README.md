HenPlanner 

A mobile app for planning hen parties — built for IS4447: Mobile Application Development at University College Cork.

HenPlanner helps the maid of honour juggle the planning for one or more hen parties: budget tracking, activity scheduling, guest management with dietary notes, weather forecasts for the destination, spending insights, target streaks and CSV export to share the plan over WhatsApp or email.

Student:*Sadhbh Slattery (122350191)
Module: IS4447 — Mobile Application Development
Lecturer: Rory Pierce
Option: B (Holiday / Trip Planner) - themes as a hen party planner

---

Features

## Core
- **CRUD for trips, activities, categories and guests**with colour-coded category chips and icon pickers
- **Budget tracking** per trip with over/under indicators and per-person calculations
- **Guest management** with dietary notes and four-state attendance tracking (full / partial / unsure / can't make it)
- **Targets** — create weekly or monthly goals, either global or per-category, with met/unmet progress indicators
- **Insights dashboard** with six views:
  - Spending bar chart by category
  - Time (minutes) bar chart by category
  - Per-hen breakdown with budget progress
  - Timeline with day / week / month toggle
  - Streaks (weekly target and longest activity streak)
  - Targets list with inline create/delete
- **Search and filter** — text search plus collapsible date-range and category filters on the home screen
- **Login system** — register, login, logout, delete profile
- **Persistent local storage** via SQLite (Drizzle ORM) — no data leaves the device
- **Accessibility** — semantic labels, roles and states on every interactive control

### Advanced
- **Dark mode** with SQLite-persisted preference
- **Weather forecast** — 5-day destination weather via Open-Meteo (no API key required, so nothing sensitive committed)
- **CSV export** — share a hen's activity plan via the native share sheet (Mail, Messages, WhatsApp, Drive, etc.)
- **Streak tracking** — consecutive weeks hitting weekly targets and longest consecutive-day activity run

---

## Tech stack

Layer | Technology 

Framework | React Native 0.81 and Expo SDK 54 
Navigation | Expo Router (file-based routing) 
Language | TypeScript 
Database | SQLite via `expo-sqlite` 
ORM | Drizzle ORM 
External API | Open-Meteo (weather and geocoding) 
File system | `expo-file-system` (SDK 54 object API)
Testing | Jest and React Native Testing Library 
Distribution | EAS Update (over-the-air bundles) 

---

## Run locally

**Prerequisites:** Node.js 20+, npm and Expo Go on a physical device (or a simulator).

```bash
# 1. Clone
git clone https://github.com/Sadhbhslattery/trip-panner.git
cd trip-panner

# 2. Install dependencies
npm install

# 3. Start the dev server
npx expo start

# 4. Scan the QR code in your terminal with Expo Go
```

The app will seed itself on first launch with three sample hens (Galway, Killarney, Lisbon), 29 activities, 25 guests, 8 categories, and 3 targets — enough to demo every feature without any typing.

---

## Tests

Three tests covering the rubric requirements:

```bash
npm test
```

Expected output:
```
PASS  __tests__/seed.test.ts
PASS  __tests__/form-field.test.tsx
PASS  __tests__/home-screen.test.tsx
Tests: 10 passed, 10 total
```

- **`seed.test.ts`** — unit test for `seedIfEmpty()`: verifies all six core tables are seeded, volumes match expectations, and running it twice doesn't duplicate data
- **`form-field.test.tsx`** — component test for the reusable `FormField`: renders label/placeholder and fires `onChangeText` on input
- **`home-screen.test.tsx`** — integration test: renders the home screen inside a mock `TripContext` and asserts seeded trips flow through to the rendered UI

---

## Short report

A separate 2-3 page short report (accompanies this repo as part of the submission) covers accessibility, UI strategy, architectural decisions, reflection on React Native vs native approaches, what went well, limitations and future work.

---

## References

See [`REFERENCES.md`](./REFERENCES.md) for full attribution of external libraries, APIs, standards, and the module starter template.

## Starter Project

Built on top of the module starter template provided by Rory Pierce ([github.com/rorypierce111/react-native-lab](https://github.com/rorypierce111/react-native-lab)). The starter provided the base Expo Router setup, themed component primitives (`ThemedText`, `ThemedView`, `HelloWave`, etc.), and the `useColorScheme` hook. All hen-planner domain work, schema, seed data, screens and advanced features are original to this submission.