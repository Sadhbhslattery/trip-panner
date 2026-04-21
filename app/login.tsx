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

  const handleLogin = async () => {
    if (!username || !password) { Alert.alert('Error', 'Please fill in both fields.'); return; }
    const results = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (results.length === 0) { Alert.alert('Error', 'No account found.'); return; }
    if (results[0].password !== password) { Alert.alert('Error', 'Incorrect password.'); return; }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ backgroundColor: c.bg, flex: 1, padding: 20 }}>
      <ScreenHeader title="Welcome Back" subtitle="Log in to your hen planner." />
      <FormField label="Username" value={username} onChangeText={setUsername} placeholder="Enter your username" />
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
