import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Redirects to the login page when nobody is logged in
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p>Loading...</p>
  return user ? children : <Navigate to="/login" replace />
}
