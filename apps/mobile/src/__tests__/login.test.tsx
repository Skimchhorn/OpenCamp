import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '@/app/login';
import { AuthProvider } from '@/lib/auth';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => true, replace: jest.fn() }),
  Stack: { Screen: () => null },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

function respond(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

function renderLogin() {
  const client = new QueryClient({
    // gcTime Infinity: no garbage-collection timers left running after the test.
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } },
  });
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

it('signs in, stores the token securely and closes', async () => {
  const fetchMock = jest.fn((url: string) =>
    url.endsWith('/api/auth/login')
      ? respond(200, { token: 'jwt-123' })
      : respond(200, { id: 1, email: 'demo@opencamp.dev', role: 'USER' }),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await renderLogin();

  await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@opencamp.dev');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledWith('opencamp.token', 'jwt-123'));
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe('http://localhost:8080/api/auth/login');
  expect(JSON.parse(init.body as string)).toEqual({ email: 'demo@opencamp.dev', password: 'password123' });
  expect(mockBack).toHaveBeenCalled();
});

it('shows an error and stores nothing on bad credentials', async () => {
  globalThis.fetch = jest.fn(() => respond(401, { status: 401 })) as unknown as typeof fetch;
  await renderLogin();

  await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@opencamp.dev');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByText('Invalid email or password.')).toBeTruthy();
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});
