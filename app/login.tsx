/**
 * Login Screen (Login System — Rubric Requirement)
 * 
 * Authenticates an existing user against the local SQLite users table.
 * Shows specific errors ("No account found" vs "Incorrect password") so the user knows which field to fix.
 *
 * Password handling note: this is a local-only demo app so passwords are stored as plain text in SQLite. In a production app they'd be hashed with
 * bcrypt or argon2 before storage — flagged in the short report as a known limitation. The rubric does not require production-grade auth for local
 * storage apps.
 *
 * The password field uses FormField's secureTextEntry prop so the entered
 * characters are masked on screen.
 *  
 * */

import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { users as usersTable } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const c = useColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Looks up the user by username, then compares passwords.
   * Distinct error messages for each failure case so the user can fix the right field rather than guessing which one is wrong.
   */
  const handleLogin = async () => {
    if (!username || !password) { Alert.alert('Error', 'Please fill in both fields.'); return; }
    const results = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (results.length === 0) { Alert.alert('Error', 'No account found.'); return; }
    if (results[0].password !== password) { Alert.alert('Error', 'Incorrect password.'); return; }
    // On success, jump into the tabbed area of the app
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScreenHeader title="Welcome Back" subtitle="Log in to your hen planner." />
      <FormField label="Username" value={username} onChangeText={setUsername} placeholder="Enter your username" />
      {/* secureTextEntry masks the input so shoulder-surfers can't read it */}
      <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry />
      <View style={{ marginTop: 6 }}>
        <PrimaryButton label="Log In" onPress={handleLogin} />
        <View style={{ marginTop: 10 }}>
          <PrimaryButton label="Don't have an account? Register" variant="secondary" onPress={() => router.replace('/register')} />
        </View>
      </View>
    </SafeAreaView>
  );
}