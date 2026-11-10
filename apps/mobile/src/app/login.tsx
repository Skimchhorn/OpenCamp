import { useMutation } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { Button, ErrorText, Field, Heading, Screen, colors, styles } from '@/components/ui';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

/** Sign in and create-account in one screen, switched by a link. */
export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const registering = mode === 'register';

  const submit = useMutation({
    mutationFn: () =>
      api<{ token: string }>(`/api/auth/${mode}`, { method: 'POST', json: { email: email.trim(), password } }),
    onSuccess: async ({ token }) => {
      await signIn(token);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 401) setError('Invalid email or password.');
      else if (e instanceof ApiError && e.status === 409) setError('That email is already registered. Sign in instead.');
      else setError(errorMessage(e));
    },
  });

  const onSubmit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8 || password.length > 72) return setError('Password must be 8 to 72 characters.');
    setError(null);
    submit.mutate();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: registering ? 'Create account' : 'Sign in' }} />
      <Heading>{registering ? 'Create your OpenCamp account' : 'Sign in to OpenCamp'}</Heading>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={registering ? 'new-password' : 'current-password'}
        textContentType={registering ? 'newPassword' : 'password'}
      />
      {registering && <Text style={styles.muted}>At least 8 characters.</Text>}
      <ErrorText>{error}</ErrorText>
      <Button title={registering ? 'Create account' : 'Sign in'} onPress={onSubmit} loading={submit.isPending} />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMode(registering ? 'login' : 'register');
          setError(null);
        }}
        style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[styles.body, { color: colors.primary, fontWeight: '600' }]}>
          {registering ? 'Have an account? Sign in' : 'New here? Create an account'}
        </Text>
      </Pressable>
    </Screen>
  );
}
