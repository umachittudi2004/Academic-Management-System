import { useState } from 'react'
import { authApi } from '../api/auth'
import { useAuth } from '../state/AuthContext.jsx'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function StudentProfile() {
  const { user, hydrate } = useAuth()
  const [Transport, setTransport] = useState(user?.Transport || '')
  const [fatherName, setFatherName] = useState(user?.fatherName || '')
  const [motherName, setMotherName] = useState(user?.motherName || '')
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
      const { data } = await authApi.updateStudent({ Transport, fatherName, motherName, password: password || undefined })
      setMsg(data.message || 'Profile updated')
      await hydrate()
      setPassword('')
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionFade>
      <form className="card grid grid-2" onSubmit={save}>
        <h3 style={{ gridColumn: '1/-1' }}>Student Profile</h3>
        <input className="input" placeholder="Transport" value={Transport} onChange={(e) => setTransport(e.target.value)} />
        <input className="input" placeholder="Father Name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
        <input className="input" placeholder="Mother Name" value={motherName} onChange={(e) => setMotherName(e.target.value)} />
        <input className="input" type="password" placeholder="New Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="row" style={{ gridColumn: '1/-1', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
        {msg && <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>{msg}</div>}
        {err && <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>{err}</div>}
      </form>
    </MotionFade>
  )
}