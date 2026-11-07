import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProtectedRoute() {
  const { auth } = useAuth()
  const location = useLocation()
  return auth ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}
