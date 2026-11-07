import { createContext } from 'react'
import type { AuthResponse } from '../api/authApi'

export interface AuthContextValue {
  auth: AuthResponse | null
  setAuth: (auth: AuthResponse) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
