import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL as string

// The API is Sanctum SPA cookie-based: requests must carry cookies
// cross-origin (withCredentials) and, for state-changing requests, the
// XSRF-TOKEN cookie value echoed back as the X-XSRF-TOKEN header. Axios does
// the XSRF header dance automatically when withXSRFToken is enabled, as long
// as the cookie is readable (it's not HttpOnly).
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

/**
 * Sanctum requires a fresh CSRF cookie before login/register (and generally
 * before the first state-changing request in a session). This hits Laravel's
 * root-level /sanctum/csrf-cookie route, not something under /api.
 */
export async function ensureCsrfCookie(): Promise<void> {
  await axios.get(`${API_URL}/sanctum/csrf-cookie`, { withCredentials: true })
}

export interface ApiErrorShape {
  status: number
  message: string
  errors?: Record<string, string[]>
}

export function toApiError(error: unknown): ApiErrorShape {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined

    return {
      status,
      message: data?.message ?? error.message ?? 'Something went wrong.',
      errors: data?.errors,
    }
  }

  return { status: 0, message: 'Something went wrong.' }
}
