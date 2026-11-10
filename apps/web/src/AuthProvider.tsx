import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, TOKEN_KEY, type Me } from './api'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const me = useQuery({
    queryKey: ['me', token],
    queryFn: () =>
      api<Me>('/api/auth/me').catch((err) => {
        // An expired or revoked token: drop it and treat the user as signed out.
        if (!(err instanceof ApiError && err.status === 401)) throw err
        localStorage.removeItem(TOKEN_KEY)
        return null
      }),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  const signIn = useCallback(
    (newToken: string) => {
      localStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
      queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    queryClient.removeQueries({ queryKey: ['saved'] })
    queryClient.invalidateQueries()
  }, [queryClient])

  const value = useMemo(
    () => ({ me: token ? (me.isPending ? undefined : (me.data ?? null)) : null, signIn, signOut }),
    [token, me.isPending, me.data, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
