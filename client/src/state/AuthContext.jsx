import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const hydrate = async () => {
    try {
      const { data } = await authApi.checkAuth()
      setUser(data.user || null)
      setRole(data.role || null)
    } catch {
      setUser(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    hydrate()
  }, [])

  const logout = async () => {
    try {
      if (role === 'student') {
        await authApi.studentLogout()
      } else if (role === 'faculty') {
        await authApi.facultyLogout()
      }
    } finally {
      setUser(null)
      setRole(null)
    }
  }

  // Add isAuthenticated derived state
  const isAuthenticated = useMemo(() => {
    return !!user && !!role
  }, [user, role])

  const value = useMemo(
    () => ({ 
      user, 
      role, 
      loading, 
      isAuthenticated,  // ← ADDED
      setUser, 
      setRole, 
      hydrate, 
      logout 
    }),
    [user, role, loading, isAuthenticated]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}