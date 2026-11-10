import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { colors } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerTintColor: colors.primary, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Sign in', presentation: 'modal' }} />
          <Stack.Screen name="campsite/[id]/index" options={{ title: 'Campsite' }} />
          <Stack.Screen name="campsite/[id]/review" options={{ title: 'Write a review', presentation: 'modal' }} />
          <Stack.Screen name="campsite/[id]/verify" options={{ title: 'Verify campsite', presentation: 'modal' }} />
          <Stack.Screen name="campsite/[id]/report" options={{ title: 'Report campsite', presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
