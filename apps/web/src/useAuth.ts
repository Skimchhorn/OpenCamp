import { createContext, useContext } from 'react'
import type { Me } from './api'

export type Auth = {
  /** undefined while the current user is loading, null when signed out. */
  me: Me | null | undefined
  signIn: (token: string) => void
  signOut: () => void
}

export const AuthContext = createContext<Auth>({ me: null, signIn: () => {}, signOut: () => {} })

export const useAuth = () => useContext(AuthContext)
