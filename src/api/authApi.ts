import { apiRequest } from './client'

const AUTH_URL = import.meta.env.VITE_AUTH_API_URL

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  username: string
  role: string
  active: boolean
}

export function login(request: LoginRequest) {
  return apiRequest<AuthResponse>(AUTH_URL, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function register(username: string, password: string) {
  return apiRequest<void>(AUTH_URL, '/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}
