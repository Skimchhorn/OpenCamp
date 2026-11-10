import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { TOKEN_KEY, type Campsite } from '../api'
import { AuthProvider } from '../AuthProvider'
import CampsiteDetailPage from './CampsiteDetailPage'
import LoginPage from './LoginPage'

/** Stub fetch with a path -> JSON body map; unknown paths return 404. */
function mockApi(routes: Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string) => {
    const path = url.split('?')[0]
    return path in routes
      ? new Response(JSON.stringify(routes[path]), { status: 200, headers: { 'Content-Type': 'application/json' } })
      : new Response('{}', { status: 404 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/" element={<p>Home page</p>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/campsites/:id" element={<CampsiteDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

it('signs in, stores the token and leaves the login page', async () => {
  const fetchMock = mockApi({
    '/api/auth/login': { token: 'abc.def.ghi' },
    '/api/auth/me': { id: 1, email: 'demo@opencamp.dev', role: 'USER' },
  })
  renderAt('/login')

  await userEvent.type(screen.getByLabelText('Email'), 'demo@opencamp.dev')
  await userEvent.type(screen.getByLabelText('Password'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByText('Home page')).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBe('abc.def.ghi')
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  expect(url).toBe('/api/auth/login')
  expect(JSON.parse(String(init.body))).toEqual({ email: 'demo@opencamp.dev', password: 'password123' })
})

it('warns that an unverified campsite is not confirmed', async () => {
  const campsite: Partial<Campsite> = {
    id: 7, name: 'Tamihi Creek Free Spot', description: 'Gravel pull-out by the creek.', latitude: 49.08, longitude: -121.82,
    region: 'Fraser Valley', roadCondition: 'GRAVEL', vehicleRequired: 'ANY_CAR', legalStatus: 'NEEDS_VERIFICATION',
    status: 'NEEDS_UPDATE', lastVerifiedAt: null, toiletAvailable: null, ratingAvg: null, reviewCount: 0,
    createdBy: 2, createdAt: '2026-01-01T00:00:00Z',
  }
  mockApi({
    '/api/campsites/7': campsite,
    '/api/campsites/7/reviews': [],
    '/api/campsites/7/verifications': [],
    '/api/campsites/7/photos': [],
  })
  renderAt('/campsites/7')

  expect(await screen.findByRole('heading', { name: 'Tamihi Creek Free Spot' })).toBeInTheDocument()
  expect(screen.getByRole('note')).toHaveTextContent('Not verified yet')
  expect(screen.getByText('Needs update')).toBeInTheDocument()
  expect(screen.getByText(/Always check local laws/)).toBeInTheDocument()
  // Null amenities read as unknown, never as "No".
  expect(screen.getByText('Toilet').nextSibling).toHaveTextContent('Unknown')
  // Signed-out visitors get no write actions.
  expect(screen.queryByRole('button', { name: 'Save campsite' })).not.toBeInTheDocument()
})
