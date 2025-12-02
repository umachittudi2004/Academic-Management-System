import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import MotionFade from './motion/MotionFade.jsx'

export default function ProtectedRoute({ role, children }) {
  const { loading, role: currentRole } = useAuth()

  if (loading) {
    return (
      <MotionFade>
        <div className="card">Checking authentication...</div>
      </MotionFade>
    )
  }

  if (!currentRole) {
    return <Navigate to="/" replace />
  }

  if (role && currentRole !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}