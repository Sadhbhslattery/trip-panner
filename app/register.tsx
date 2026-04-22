/**
 * Register Screen (Login System — Rubric Requirement)
 * 
 * Creates a new user account in the local SQLite users table.
 *
 * Validation chain, in order:
 * 1. Both fields filled
 * 2. Password and confirm-password match
 * 3. Username is not already taken
 *
 * Order matters — cheaper checks (field presence, match) run before the DB lookup, so we don't hit SQLite when the form is obviously invalid.
 *
 * On success: alert the user, then redirect to /login rather than auto-logging them in. This confirms the account was created and matches the convention
 * most real-world apps follow (explicit sign-in after sign-up).
 */

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

export default function RegisterScreen() {
  const router = useRouter();
  const c = useColors();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    // Cheap validations first — avoid hitting SQLite until the form looks OK
    if (!username || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match.'); return; }

    // Uniqueness check — prevents duplicate usernames in a local DB that has no unique constraint on the column (flagged in report)
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (existing.length > 0) { Alert.alert('Error', 'Username already taken.'); return; }

    await db.insert(usersTable).values({ username, password });
    Alert.alert('Success', 'Account created!', [{ text: 'OK', onPress: () => router.replace('/login') }]);
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScreenHeader title="Create Account" subtitle="Get started planning." />
      <FormField label="Username" value={username} onChangeText={setUsername} placeholder="Pick a username" />
      <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Choose a password" secureTextEntry />
      <FormField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Type it again" secureTextEntry />
      <View style={{ marginTop: 6 }}>
        <PrimaryButton label="Create Account" onPress={handleRegister} />
        <View style={{ marginTop: 10 }}>
          <PrimaryButton label="Already have an account? Log In" variant="secondary" onPress={() => router.replace('/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}