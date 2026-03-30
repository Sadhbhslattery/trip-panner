import FormField from '@/components/ui/form-field';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { users as usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    const results = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (results.length === 0) {
      Alert.alert('Error', 'No account found with that username.');
      return;
    }

    const user = results[0];
    if (user.password !== password) {
      Alert.alert('Error', 'Incorrect password.');
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Log In" subtitle="Welcome back." />

      <View style={styles.form}>
        <FormField label="Username" value={username} onChangeText={setUsername} placeholder="Enter your username" />
        <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" />
      </View>

      <PrimaryButton label="Log In" onPress={handleLogin} />

      <View style={styles.spacer}>
        <PrimaryButton
          label="Don't have an account? Register"
          variant="secondary"
          onPress={() => router.replace('/register')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    padding: 20,
  },
  form: {
    marginBottom: 6,
  },
  spacer: {
    marginTop: 10,
  },
});
