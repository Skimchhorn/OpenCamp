import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';

import { CampsiteCard } from '@/components/CampsiteCard';
import { Button, ErrorText, Heading, Screen, styles } from '@/components/ui';
import { api, errorMessage, type Campsite } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SavedScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api<Campsite[]>('/api/me/saved-campsites'),
    enabled: !!token,
  });

  return (
    <Screen tab>
      <Heading>Saved campsites</Heading>
      {!token ? (
        <>
          <Text style={styles.body}>Sign in to see the campsites you saved.</Text>
          <Button title="Sign in" onPress={() => router.push('/login')} />
        </>
      ) : saved.isPending ? (
        <ActivityIndicator accessibilityLabel="Loading saved campsites" />
      ) : saved.error ? (
        <>
          <ErrorText>{errorMessage(saved.error)}</ErrorText>
          <Button title="Try again" variant="secondary" onPress={() => saved.refetch()} />
        </>
      ) : saved.data.length === 0 ? (
        <Text style={styles.muted}>Nothing saved yet. Open a campsite and tap Save.</Text>
      ) : (
        saved.data.map((c) => (
          <CampsiteCard key={c.id} campsite={c} onPress={() => router.push(`/campsite/${c.id}`)} />
        ))
      )}
    </Screen>
  );
}
