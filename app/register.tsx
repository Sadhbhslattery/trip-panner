import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { useColors } from '@/hooks/useColors';
import { db } from '@/db/client';
import { users as usersTable } from '@/db/schema';
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
    if (!username || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match.'); return; }
    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (existing.length > 0) { Alert.alert('Error', 'Username already taken.'); return; }
    await db.insert(usersTable).values({ username, password });
    Alert.alert('Success', 'Account created!', [{ text: 'OK', onPress: () => router.replace('/login') }]);
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScreenHeader title="Create Account" subtitle="Get started planning." />
      <FormField label="Username" value={username} onChangeText={setUsername} placeholder="Pick a username" />
      <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Choose a password" />
      <FormField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Type it again" />
      <View style={{ marginTop: 6 }}>
        <PrimaryButton label="Create Account" onPress={handleRegister} />
        <View style={{ marginTop: 10 }}>
          <PrimaryButton label="Already have an account? Log In" variant="secondary" onPress={() => router.replace('/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
