import { useEffect, useState } from 'react'
import { attendanceApi } from '../api/attendence.js'
import MotionFade from '../components/motion/MotionFade.jsx'
import AttendanceTimer from '../components/AttendenceTimer.jsx'

export default function Attendance() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    setMsg('')
    setErr('')
    setLoading(true)
    try {
      const { data } = await attendanceApi.checkSessions()
      setSessions(data.attendenceSession || [])
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const mark = async (subjectId) => {
    setMsg('')
    setErr('')
    try {
      const { data } = await attendanceApi.mark(subjectId)
      setMsg(data.message || 'Attendance marked')
      await load()
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to mark attendance')
    }
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        <div className="card">
          <h3>Active Attendance Sessions</h3>
          <div className="muted">Mark your attendance before the session expires</div>
        </div>

        {loading && (
          <div className="card">
            <div className="muted">Loading sessions...</div>
          </div>
        )}

        {msg && (
          <div className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
            {msg}
          </div>
        )}
        
        {err && (
          <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
            {err}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="card">
            <div className="tag" style={{ borderColor: 'rgba(255,193,7,0.5)', color: '#ffd54f' }}>
              No active attendance sessions available
            </div>
          </div>
        )}

        {sessions.map(s => (
          <div key={s._id} className="card">
            <div className="grid" style={{ gap: 12 }}>
              {/* Timer Section */}
              <AttendanceTimer 
                createdAt={s.createdAt} 
                expiresIn={1800}
              />

              {/* Session Details */}
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                backgroundColor: 'rgba(147,197,253,0.1)',
                border: '1px solid rgba(147,197,253,0.2)'
              }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Subject ID:</strong> <span className="muted">{s.subjectId}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Year:</strong> <span className="muted">{s.year}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Branch:</strong> <span className="muted">{s.branch}</span>
                </div>
                <div>
                  <strong>Section:</strong> <span className="muted">{s.section}</span>
                </div>
              </div>

              {/* Mark Attendance Button */}
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button 
                  className="btn" 
                  onClick={() => mark(s.subjectId)}
                  style={{ 
                    backgroundColor: 'rgba(34,197,94,0.2)',
                    borderColor: 'rgba(34,197,94,0.4)',
                    color: '#c6ffda'
                  }}
                >
                  ✓ Mark Present
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="card">
          <div className="muted" style={{ fontSize: '0.875rem' }}>
            <strong>Note:</strong> Backend uses GET for marking attendance and checks IP. Make sure you're on campus network.
          </div>
        </div>
      </div>
    </MotionFade>
  )
}