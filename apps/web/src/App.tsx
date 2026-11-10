import { NavLink, Route, Routes } from 'react-router'
import { RequireAuth } from './components'
import AdminPage from './pages/AdminPage'
import CampsiteDetailPage from './pages/CampsiteDetailPage'
import CampsiteFormPage from './pages/CampsiteFormPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import SavedPage from './pages/SavedPage'
import { useAuth } from './useAuth'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2 py-1 text-sm font-medium ${isActive ? 'bg-emerald-900 text-white' : 'text-emerald-50 hover:bg-emerald-700'}`

export default function App() {
  const { me, signOut } = useAuth()
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <header className="bg-emerald-800 text-white">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <NavLink to="/" className="mr-2 text-lg font-bold">
            OpenCamp
          </NavLink>
          <NavLink to="/" end className={navClass}>
            Map
          </NavLink>
          <NavLink to="/campsites/new" className={navClass}>
            Add campsite
          </NavLink>
          {me && (
            <NavLink to="/saved" className={navClass}>
              Saved
            </NavLink>
          )}
          {me?.role === 'ADMIN' && (
            <NavLink to="/admin" className={navClass}>
              Moderation
            </NavLink>
          )}
          <span className="ml-auto flex items-center gap-3 text-sm">
            {me ? (
              <>
                <span className="hidden sm:inline">{me.email}</span>
                <button type="button" onClick={signOut} className="rounded px-2 py-1 font-medium hover:bg-emerald-700">
                  Sign out
                </button>
              </>
            ) : (
              me === null && (
                <NavLink to="/login" className={navClass}>
                  Sign in
                </NavLink>
              )
            )}
          </span>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/campsites/new" element={<RequireAuth><CampsiteFormPage /></RequireAuth>} />
          <Route path="/campsites/:id" element={<CampsiteDetailPage />} />
          <Route path="/campsites/:id/edit" element={<RequireAuth><CampsiteFormPage /></RequireAuth>} />
          <Route path="/saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
      <footer className="border-t border-stone-300 px-4 py-4 text-center text-xs text-stone-600">
        Free campsites only. Community data: check local rules before you go and leave no trace.
      </footer>
    </div>
  )
}
