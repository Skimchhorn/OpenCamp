import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Button, DISCLAIMER, Heading, Notice, Screen, styles } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function AccountScreen() {
  const router = useRouter();
  const { token, user, signOut } = useAuth();

  return (
    <Screen tab>
      <Heading>Account</Heading>
      {token ? (
        <>
          <Text style={styles.body}>Signed in as {user?.email ?? '…'}</Text>
          <Button title="Sign out" variant="secondary" onPress={signOut} />
        </>
      ) : (
        <>
          <Text style={styles.body}>Sign in to save campsites and share what you find.</Text>
          <Button title="Sign in or create account" onPress={() => router.push('/login')} />
        </>
      )}
      <Notice tone="info">{DISCLAIMER}</Notice>
    </Screen>
  );
}
