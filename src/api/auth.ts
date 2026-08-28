import { apiClient, API_URL, ensureCsrfCookie } from './client'
import type { User } from '../types'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface LoginPayload {
  email: string
  password: string
}

export async function register(payload: RegisterPayload): Promise<User> {
  await ensureCsrfCookie()
  const { data } = await apiClient.post<{ data: User }>('/api/register', payload)
  return data.data
}

export async function login(payload: LoginPayload): Promise<User> {
  await ensureCsrfCookie()
  const { data } = await apiClient.post<{ data: User }>('/api/login', payload)
  return data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/logout')
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await apiClient.get<{ data: User }>('/api/user')
    return data.data
  } catch {
    return null
  }
}

/** Full-page redirect (not an XHR call) to kick off Google OAuth. */
export function googleRedirectUrl(): string {
  return `${API_URL}/api/auth/google/redirect`
}
