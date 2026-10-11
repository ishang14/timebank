import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Only wait for the server when there is a saved token to check
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))

  // On page load, restore the session if a token is saved
  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  // mode is 'login' or 'signup'
  async function authenticate(mode, data) {
    const res = await api.post(`/auth/${mode}`, data)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  // Reload the user (e.g. to update the balance shown in the navbar)
  async function refreshUser() {
    const res = await api.get('/auth/me')
    setUser(res.data.user)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// The hook lives next to its provider on purpose
// oxlint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext)
