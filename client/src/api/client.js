import axios from 'axios'

// Base URL is /api; Vite proxies it to the server in development
const api = axios.create({ baseURL: '/api' })

// Send the saved token with every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
