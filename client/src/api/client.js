import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

// Optional: response interceptor to handle 401s globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // You could redirect, clear state, etc. For now, just propagate.
    }
    return Promise.reject(error)
  }
)