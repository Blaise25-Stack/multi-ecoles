import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ExtendedApi extends AxiosInstance {
  upload: <T = unknown>(url: string, formData: FormData) => Promise<{ data: ApiResponse<T> }>
  download: (url: string, filename: string) => Promise<void>
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const api = axiosInstance as ExtendedApi

api.upload = async <T = unknown>(url: string, formData: FormData) => {
  const response = await axiosInstance.post<ApiResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response
}

api.download = async (url: string, filename: string) => {
  const response = await axiosInstance.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

axiosInstance.interceptors.request.use(
  (config) => {
    const { token, currentSchool } = useAuthStore.getState()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (currentSchool?.id && config.headers) {
      config.headers['X-School-Id'] = String(currentSchool.id)
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { token } = response.data.data

          const currentUser = useAuthStore.getState().user
          if (currentUser) {
            useAuthStore.getState().setAuth(currentUser, token, refreshToken)
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return axiosInstance(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const apiService = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    const response = await api.get<ApiResponse<T>>(url, { params })
    return response.data
  },

  post: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await api.post<ApiResponse<T>>(url, data)
    return response.data
  },

  put: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await api.put<ApiResponse<T>>(url, data)
    return response.data
  },

  patch: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await api.patch<ApiResponse<T>>(url, data)
    return response.data
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    const response = await api.delete<ApiResponse<T>>(url)
    return response.data
  },

  postForm: async <T>(url: string, formData: FormData): Promise<ApiResponse<T>> => {
    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  putForm: async <T>(url: string, formData: FormData): Promise<ApiResponse<T>> => {
    const response = await api.put<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  upload: async <T>(url: string, formData: FormData): Promise<ApiResponse<T>> => {
    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  download: async (url: string, filename: string): Promise<void> => {
    await api.download(url, filename)
  },
}

export const buildPaginationParams = (params: Record<string, unknown>): Record<string, string> => {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = String(value)
    }
  }

  return result
}

export default api
