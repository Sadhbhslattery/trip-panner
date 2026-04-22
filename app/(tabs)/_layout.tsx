/**
 * Tab Layout — Bottom Tab Navigation
 * 
 * Defines the four bottom tabs (Hens, Categories, Insights, Profile) using expo-router's <Tabs> component. Each tab maps to the same-named file in
 * the /app/(tabs) directory via file-based routing.
 *
 * Dark mode integration: the tab bar's own colours (active/inactive tint, bar background, border) read from the global isDark state in TripContext,
 * so the tab bar switches themes in lockstep with the rest of the app [R7].
 *
 * The headerShown: false option turns off the default stack header for every tab screen — each screen provides its own ScreenHeader component
 * so we can control the title/subtitle styling and keep branding consistent.
 */

import { TripContext } from '@/app/_layout';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useContext } from 'react';

export default function TabLayout() {
  const ctx = useContext(TripContext);
  // Fallback to light mode if context isn't available yet (unlikely but safe)
  const dark = ctx?.isDark ?? false;

  return (
    <Tabs screenOptions={{
      // Tab colours shift based on dark mode state from TripContext
      tabBarActiveTintColor: dark ? '#E86A98' : '#D4537E',
      tabBarInactiveTintColor: dark ? '#7A6284' : '#9CA3AF',
      tabBarStyle: {
        backgroundColor: dark ? '#1A0E1E' : '#FFFFFF',
        borderTopColor: dark ? '#4A2D50' : '#F0C6D4',
      },
      headerShown: false,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Hens', tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}