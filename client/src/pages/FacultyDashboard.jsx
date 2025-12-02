import { useState, useEffect } from 'react'
import { attendanceApi } from '../api/attendence.js'
import { timetableApi } from '../api/timetable.js'
import { useAuth } from '../state/AuthContext.jsx'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [nextPeriod, setNextPeriod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingPeriod, setFetchingPeriod] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const fetchCurrentPeriod = async () => {
      try {
        const { data } = await timetableApi.getCurrentPeriod()
        setCurrentPeriod(data.currentPeriod)
        setNextPeriod(data.nextPeriod)
      } catch (error) {
        console.error('Failed to fetch current period')
      } finally {
        setFetchingPeriod(false)
      }
    }
    
    fetchCurrentPeriod()
    
    const interval = setInterval(fetchCurrentPeriod, 60000)
    return () => clearInterval(interval)
  }, [])

  const startSession = async () => {
    if (!currentPeriod) {
      setErr('No active period right now')
      return
    }

    setMsg('')
    setErr('')
    setLoading(true)
    
    try {
      const { data } = await attendanceApi.startSession({
        subjectId: currentPeriod.subjectId._id,
        year: currentPeriod.year,
        branch: currentPeriod.branch,
        section: currentPeriod.section
      })
      setMsg(data.message || 'Session started successfully')
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        <div className="card">
          <h2>Hello, {user?.name || user?.empId || 'Faculty'}</h2>
          <div className="muted">Start attendance for your current period</div>
        </div>

        {fetchingPeriod ? (
          <div className="card">
            <div className="muted">Loading current period...</div>
          </div>
        ) : currentPeriod ? (
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)',
            borderColor: 'rgba(34,197,94,0.4)'
          }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ marginBottom: 8, color: '#c6ffda' }}>🟢 Current Period</h3>
                <div className="muted" style={{ fontSize: '0.875rem' }}>
                  Period {currentPeriod.periodNumber} • {currentPeriod.startTime} - {currentPeriod.endTime}
                </div>
              </div>
            </div>

            <div style={{ 
              padding: 16, 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: 8,
              marginBottom: 16
            }}>
              <div style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: '1.1rem' }}>
                  {currentPeriod.subjectId.subjectCode} - {currentPeriod.subjectId.subjectName}
                </strong>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="tag">Year {currentPeriod.year}</span>
                <span className="tag">{currentPeriod.branch}</span>
                <span className="tag">Section {currentPeriod.section}</span>
                {currentPeriod.roomNumber && (
                  <span className="tag">Room {currentPeriod.roomNumber}</span>
                )}
              </div>
            </div>

            <button 
              className="btn" 
              onClick={startSession}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                background: 'rgba(34,197,94,0.2)',
                borderColor: 'rgba(34,197,94,0.4)',
                color: '#c6ffda'
              }}
            >
              {loading ? 'Starting...' : '✓ Start Attendance Session'}
            </button>
          </div>
        ) : (
          <div className="card" style={{ 
            background: 'rgba(255,193,7,0.1)',
            borderColor: 'rgba(255,193,7,0.3)'
          }}>
            <div className="tag" style={{ 
              borderColor: 'rgba(255,193,7,0.5)', 
              color: '#ffd54f',
              fontSize: '1rem'
            }}>
              ⏸️ No active period right now
            </div>
            <div className="muted" style={{ marginTop: 12, fontSize: '0.875rem' }}>
              Check your timetable or wait for your next scheduled class
            </div>
          </div>
        )}

        {nextPeriod && (
          <div className="card">
            <h4 style={{ marginBottom: 12 }}>📅 Next Period</h4>
            <div style={{ 
              padding: 12, 
              background: 'rgba(147,197,253,0.1)', 
              borderRadius: 8,
              border: '1px solid rgba(147,197,253,0.2)'
            }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{nextPeriod.subjectId.subjectCode} - {nextPeriod.subjectId.subjectName}</strong>
                <span className="muted">{nextPeriod.startTime} - {nextPeriod.endTime}</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <span className="tag" style={{ fontSize: '0.75rem' }}>
                  Year {nextPeriod.year}
                </span>
                <span className="tag" style={{ fontSize: '0.75rem' }}>
                  {nextPeriod.branch}
                </span>
                <span className="tag" style={{ fontSize: '0.75rem' }}>
                  Section {nextPeriod.section}
                </span>
              </div>
            </div>
          </div>
        )}

        {msg && (
          <div className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
            ✓ {msg}
          </div>
        )}
        {err && (
          <div className="tag" style={{ 
            borderColor: 'rgba(255,107,107,0.5)', 
            color: '#ffb0b0',
            whiteSpace: 'pre-line'
          }}>
            ✕ {err}
          </div>
        )}
      </div>
    </MotionFade>
  )
}