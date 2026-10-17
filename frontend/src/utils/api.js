import axios from 'axios'

// API base URL comes from the environment (see frontend/.env.example):
//   - local development: falls back to http://localhost:5000/api
//   - deployed build   : set VITE_API_URL in your hosting dashboard (e.g. Netlify)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API = axios.create({
  baseURL: BASE_URL,
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Requests where a 401 just means "wrong email/password" - the page must show that message,
// not reload the login page and lose it.
const AUTH_ATTEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/admin-login']

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthAttempt = AUTH_ATTEMPT_PATHS.some((p) => url.includes(p))
    const hadSession = Boolean(localStorage.getItem('token'))
    const deactivated = status === 403 && /deactivated/i.test(error.response?.data?.message || '')

    // Expired / invalid token, or an account an admin has deactivated: end the session.
    if (!isAuthAttempt && hadSession && (status === 401 || deactivated)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Friendly message for any failed request (server message first, then sensible fallbacks).
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection and try again.'
  return fallback
}

export default API
