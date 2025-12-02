import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../state/AuthContext.jsx'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function StudentLogin() {
  const [rollno, setRollno] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { hydrate } = useAuth()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.studentLogin({ rollno, password })
      await hydrate()
      navigate('/student')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionFade>
      <form className="card grid" onSubmit={onSubmit} style={{ gap: 12 }}>
        <h2>Student Login</h2>
        <input className="input" placeholder="Roll No" value={rollno} onChange={(e) => setRollno(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>{error}</div>}
        <button className="btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </MotionFade>
  )
}