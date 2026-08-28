import axios, { AxiosError } from 'axios'
import { API_BASE_URL, AUTH_TOKEN_STORAGE_KEY } from '@/config/env'
import type { ApiError } from '@/types/common'

// This is the ONLY place that knows how to talk to the real backend.
// Every service in src/services/* calls through here when
// DATA_SOURCE === 'live'. Point it at the Spring Boot app by changing
// VITE_API_BASE_URL — nothing else in the app needs to change.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string> }>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message ?? 'Something went wrong',
      status: error.response?.status,
      fieldErrors: error.response?.data?.errors,
    }
    return Promise.reject(apiError)
  },
)
