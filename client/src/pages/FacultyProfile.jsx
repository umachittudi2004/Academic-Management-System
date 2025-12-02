import { useState } from 'react'
import { authApi } from '../api/auth'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function FacultyProfile() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    setLoading(true)
    try {
      const { data } = await authApi.updateFaculty({ password: password || undefined })
      setMsg(data.message || 'Profile updated')
      setPassword('')
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionFade>
      <form className="card grid" onSubmit={save}>
        <h3>Faculty Profile</h3>
        <input className="input" type="password" placeholder="New Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
        {msg && <div className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>{msg}</div>}
        {err && <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>{err}</div>}
      </form>
    </MotionFade>
  )
}