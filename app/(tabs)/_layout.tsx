import { TripContext } from '@/app/_layout';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useContext } from 'react';

export default function TabLayout() {
  const ctx = useContext(TripContext);
  const dark = ctx?.isDark ?? false;

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: dark ? '#E86A98' : '#D4537E',
      tabBarInactiveTintColor: dark ? '#7A6284' : '#9CA3AF',
      tabBarStyle: { backgroundColor: dark ? '#1A0E1E' : '#FFFFFF', borderTopColor: dark ? '#4A2D50' : '#F0C6D4' },
      headerShown: false,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Hens', tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
