# References

This document lists the external sources that informed the design and implementation of HenPlanner. References are cited inline in the source code using the `[Rn]` notation and in the short report.

Accessed April 2026 unless otherwise noted.

---

## AI Colloboration 
[R0] Claude (Anthropic)
Anthropic. Claude (Opus 4.7 and Opus 4.6). AI assistant used as a collaborative coding and writing partner throughout the project.
https://claude.ai/

Claude was used across the project: debugging error messages (EAS authorisation failures, expo-sqlite web bundle crashes), drafting and reviewing TypeScript code, sanity-checking architectural decisions, generating seed data and writing the three required test files. Where Claude produced code, I read every line, and verified behaviour on device before committing. One bug surfaced during the final commenting pass, `activity/[id]/edit.tsx`. Catching it taught me how much prompt clarity matters for AI output quality. 

# Frontend & Framework

[R6] React — Hooks API Reference
Meta. Built-in React Hooks (useState, useEffect, useMemo, useContext).
https://react.dev/reference/react/hooks
Used throughout the app for state management, side effects (e.g. weather fetch on destination change), memoising heavy derived data (timeline bucketing, streak calculation, home-screen filters), and cross-screen state sharing via `TripContext`.

[R11] React Native Testing Library
Callstack. User-centric component testing library for React Native.
https://callstack.github.io/react-native-testing-library/
Used to write the `FormField` component test and the home-screen integration test, using render, waitFor and fireEvent.changeText to simulate real user interaction.

[R10] Jest
Meta. JavaScript testing framework.
https://jestjs.io/
Used as the test runner, with the `jest-expo` preset that configures transform patterns for Expo modules. All three rubric-required tests (seed unit, FormField component, home-screen integration) run through Jest.

[R13] Codevolution — React Native / Expo tutorial series (YouTube)
Codevolution. Tutorials on React Native fundamentals, Expo Router, and React Hooks.
https://www.youtube.com/@Codevolution
Consulted for worked examples of Expo Router file-based navigation (Stack vs Tabs), useState/useEffect patterns and React Hooks fundamentals. Used particularly at the start of the project when setting up the tabs layout and the trip detail stack.

---

## Web Standards & Language Documentation

[R14] MDN Web Docs
Mozilla. Reference documentation for JavaScript, TypeScript and web standards.
https://developer.mozilla.org/
Used for Array.prototype.reduce, Array.prototype.filter, Array.prototype.some, Set and Date API references — especially while writing the streak calculation logic and the homescreen filter pipeline.

[R15] Apple Human Interface Guidelines — Layout
Apple Inc. Layout specifications including minimum tappable target size.
https://developer.apple.com/design/human-interface-guidelines/layout
Cited as the source for the 44pt minimum touch target applied to PrimaryButton during the accessibility pass.

[R16] Stack Overflow — community threads
Stack Overflow. Developer Q&A threads consulted while debugging specific problems.
https://stackoverflow.com/
Threads consulted during debugging included:
- Masking password input in React Native (secureTextEntry on TextInput) - surfaced during the accessibility pass when I noticed passwords were rendering in plain text.
- Fixing npm EACCES permission errors when attempting to install eas-cli globally on macOS — led to the decision to use npx eas-cli@latest instead of a global install, which avoids sudo and permission issues entirely.
- EAS "Entity not authorised" errors when the project was linked to a different owner account than the current login — helped narrow the fix to editing app.json's owner field and stale projectId.

---

# Expo Platform

[R1] Expo File System (SDK 54)
Expo. Modern object-based File and Paths API, stable in SDK 54.
https://docs.expo.dev/versions/latest/sdk/filesystem/
Blog post on the upgrade: https://expo.dev/blog/expo-file-system
Used by `db/export.ts` to write CSV files into the app's sandboxed document directory. The new `File`/`Paths` API replaces the deprecated string-path helpers and is the recommended approach for SDK 54+.

[R3] Expo Sharing
Expo. Native share sheet integration.
https://docs.expo.dev/versions/latest/sdk/sharing/
Used after CSV export to hand the generated file to the OS share sheet so the user can send it to Mail, Messages, WhatsApp, Drive, etc.

[R8] Expo SQLite
Expo. Local SQLite database API for Expo apps.
https://docs.expo.dev/versions/latest/sdk/sqlite/
Underlies the persistence layer in `db/client.ts`. Provides the `openDatabaseSync` call and the low-level `execSync` used to create tables on first launch.

[R17] Expo Router — File-based Routing
Expo. Conventions for file-based routing in Expo applications.
https://docs.expo.dev/router/introduction/
Referenced for the app/(tabs)/ grouping, dynamic route segments (trip/[id], activity/[id]), and the _layout.tsx pattern used at the root and tabs levels.

[R18] EAS Update
Expo. Over-the-air bundle distribution for Expo apps.
https://docs.expo.dev/eas-update/introduction/
Used for distributing the app to markers via a shareable Expo Go link rather than building native binaries. The per-platform publish pattern (--platform ios then --platform android) was adopted after the default --platform=all behaviour failed on the web bundle because of a missing wasm file in expo-sqlite's web implementation.

---

## Data & ORM

[R9] Drizzle ORM — Expo SQLite Driver
Drizzle Team. TypeScript-first ORM with an Expo SQLite integration.
https://orm.drizzle.team/docs/connect-expo-sqlite
Used for every database query in the app. Chosen for its type-safe query builder, lightweight footprint and native Expo/React Native support.

---

## External API

[R4] Open-Meteo API
Open-Meteo. Free, no-key weather and geocoding APIs.
https://open-meteo.com/en/docs
https://open-meteo.com/en/docs/geocoding-api
Powers the `WeatherCard` component. The app makes a two-step call: geocode the trip destination to latitude/longitude via the geocoding endpoint, then fetch a 5-day daily forecast from the main weather endpoint. Chosen specifically because it requires no API key, which means no secrets are committed to the repository.

[R5] WMO Weather Interpretation Codes
World Meteorological Organization. Standard weather condition codes used by Open-Meteo.
https://open-meteo.com/en/docs (Weather variable documentation, section "Weather Code")
Mapped in `WeatherCard` to human-readable labels (Clear, Cloudy, Rain, Snow, etc.) and corresponding emoji for visual scanability.

---

## Standards

[R2] RFC 4180 — Common Format and MIME Type for CSV Files
IETF. The standard specification for CSV file format, including quoting and escaping rules.
https://datatracker.ietf.org/doc/html/rfc4180
Referenced in `db/export.ts`. The `escapeCsvField` helper wraps any field containing commas, quotes or newlines in double quotes and doubles embedded quotes, per section 2.6 of the RFC. Without this, a note like `"Dinner, 7:30pm"` would break the downstream CSV.

---

## Advanced Feature Patterns

[R7] Persisting User Preferences in SQLite
Pattern informed by Expo SQLite and React documentation (see [R6], [R8]).
The dark mode toggle in `app/_layout.tsx` and `app/(tabs)/profile.tsx` writes the new theme value to the `users.theme` column before updating React state. This DB-first ordering ensures SQLite is the source of truth: if the state update fails for any reason, the next app launch will still reflect the user's choice.

---

## Module Starter Template

[R12] IS4447 Module Starter Repository
Pierce, R. (2026). *react-native-lab* [Source code]. IS4447: Mobile Application Development, University College Cork.
https://github.com/rorypierce111/react-native-lab

Provided by the module lecturer, Rory Pierce, as the starting point for this project. The starter supplied:
- Initial Expo project setup (Expo Router structure, `app/_layout.tsx`, `app/(tabs)/_layout.tsx` boilerplate)
- Base theme primitives (`ThemedText`, `ThemedView`, `HelloWave`, `ParallaxScrollView`, `HapticTab`, `IconSymbol`, `Collapsible`, `ExternalLink`)
- The `useColorScheme` hook and `use-theme-color` hook
- Baseline TypeScript, ESLint, and `tsconfig` configuration
- The `package.json` name `react-native-lab` 

---

## Notes on Originality

The base Expo Router structure, themed component primitives (`ThemedText`, `ThemedView`, `HelloWave`, `ParallaxScrollView`, `HapticTab`, `IconSymbol`, `Collapsible`, `ExternalLink`), the `useColorScheme` hook and initial TypeScript/ESLint configuration were provided in the module starter template ([R12]). These form a standard React Native and Expo foundation that was not modified significantly for this project.

All hen-planner domain work was built on top of this foundation and is original to this submission, including:
- The full database schema and seed data (`db/schema.ts`, `db/seed.ts`, `db/client.ts`)
- All feature screens (trips, activities, categories, guests, insights, login, register, profile, add/edit flows)
- The theme system extension via `hooks/useColors.ts` and `constants/theme.ts` (built on top of the starter's `useColorScheme`)
- All advanced features: dark-mode persistence logic, CSV export (`db/export.ts`), weather integration (`components/WeatherCard.tsx`), streak calculation and targets CRUD
- Custom UI primitives for this project (`FormField`, `PrimaryButton`, `ScreenHeader`, `InfoTag`)
- All three test files (`__tests__/seed.test.ts`, `__tests__/form-field.test.tsx`, `__tests__/home-screen.test.tsx`)
- All business logic (streak calculation, CSV escaping per RFC 4180, filter pipeline, category-colour mapping, guest attendance status system, budget over/under calculation)

External references listed above were used for API usage patterns and standards only.

Seed data (hen party itineraries, activity lists, guest names, venue details) is fictional and was written by the author based knowledge of Irish hen party planning.