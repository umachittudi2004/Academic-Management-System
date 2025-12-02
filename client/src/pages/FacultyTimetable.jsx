import { useState, useEffect } from 'react'
import { timetableApi } from '../api/timetable'
import { useAuth } from '../state/AuthContext.jsx'
import MotionFade from '../components/motion/MotionFade.jsx'

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function FacultyTimetable() {
  const { user } = useAuth()
  const [timetable, setTimetable] = useState({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selectedDay, setSelectedDay] = useState('Monday')

  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true)
      setErr('')
      try {
        const { data } = await timetableApi.getFacultyTimetable()
        setTimetable(data.timetable || {})
      } catch (error) {
        setErr(error?.response?.data?.message || 'Failed to fetch timetable')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimetable()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return

    try {
      await timetableApi.delete(id)
      // Refresh timetable
      const { data } = await timetableApi.getFacultyTimetable()
      setTimetable(data.timetable || {})
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to delete entry')
    }
  }

  const getTotalPeriods = () => {
    return Object.values(timetable).flat().length
  }

  const getPeriodsByDay = (day) => {
    return timetable[day]?.length || 0
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        {/* Header */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3>My Timetable</h3>
              <div className="muted">Faculty: {user?.name || user?.empId}</div>
            </div>
            <div className="tag" style={{ borderColor: 'rgba(108,154,255,0.4)', color: '#bfdbfe' }}>
              📚 Total: {getTotalPeriods()} periods/week
            </div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
            ✕ {err}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card">
            <div className="muted">Loading timetable...</div>
          </div>
        )}

        {/* Day Selector */}
        {!loading && Object.keys(timetable).length > 0 && (
          <div className="card">
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {DAYS_ORDER.map(day => (
                <button
                  key={day}
                  className="btn"
                  onClick={() => setSelectedDay(day)}
                  style={{
                    background: selectedDay === day 
                      ? 'rgba(108,154,255,0.3)' 
                      : 'rgba(147,197,253,0.1)',
                    borderColor: selectedDay === day 
                      ? 'rgba(108,154,255,0.6)' 
                      : 'rgba(147,197,253,0.3)',
                    color: selectedDay === day ? '#bfdbfe' : 'rgba(255,255,255,0.7)'
                  }}
                >
                  {day}
                  {timetable[day] && (
                    <span style={{ 
                      marginLeft: 8, 
                      fontSize: '0.75rem',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {getPeriodsByDay(day)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timetable Display */}
        {!loading && timetable[selectedDay] && (
          <div className="card">
            <h4 style={{ marginBottom: 16 }}>
              📅 {selectedDay} Schedule
              <span className="muted" style={{ fontSize: '0.875rem', marginLeft: 12 }}>
                ({timetable[selectedDay].length} periods)
              </span>
            </h4>

            <div className="grid" style={{ gap: 12 }}>
              {timetable[selectedDay]
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map((entry, index) => (
                  <div key={entry._id}>
                    <div className="card" style={{
                      background: 'rgba(147,197,253,0.05)',
                      border: '1px solid rgba(147,197,253,0.2)',
                      padding: 16
                    }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                        <div className="row" style={{ gap: 12 }}>
                          <div style={{
                            background: 'rgba(108,154,255,0.2)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            color: '#bfdbfe',
                            minWidth: 60,
                            textAlign: 'center'
                          }}>
                            P{entry.periodNumber}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.95rem', color: '#bfdbfe' }}>
                              {entry.startTime} - {entry.endTime}
                            </div>
                            <div className="muted" style={{ fontSize: '0.75rem' }}>
                              50 minutes
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn danger"
                          onClick={() => handleDelete(entry._id)}
                          style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12
                      }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong style={{ fontSize: '1.05rem' }}>
                            {entry.subjectId.subjectCode}
                          </strong>
                          <span className="muted" style={{ marginLeft: 8 }}>
                            {entry.subjectId.subjectName}
                          </span>
                        </div>

                        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <span className="tag" style={{ fontSize: '0.75rem' }}>
                            Year {entry.year}
                          </span>
                          <span className="tag" style={{ fontSize: '0.75rem' }}>
                            {entry.branch}
                          </span>
                          <span className="tag" style={{ fontSize: '0.75rem' }}>
                            Section {entry.section}
                          </span>
                          {entry.roomNumber && (
                            <span className="tag" style={{ fontSize: '0.75rem', borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                              🚪 {entry.roomNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lunch Break Indicator */}
                    {entry.periodNumber === 4 && index < timetable[selectedDay].length - 1 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        background: 'rgba(255,193,7,0.1)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,193,7,0.3)',
                        margin: '12px 0'
                      }}>
                        <div style={{ color: '#ffd54f', fontWeight: 500 }}>
                          🍽️ LUNCH BREAK
                        </div>
                        <div className="muted" style={{ fontSize: '0.75rem' }}>
                          12:50 PM - 1:30 PM (40 minutes)
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* No timetable for selected day */}
        {!loading && !timetable[selectedDay] && (
          <div className="card" style={{
            background: 'rgba(255,193,7,0.1)',
            borderColor: 'rgba(255,193,7,0.3)',
            textAlign: 'center',
            padding: 40
          }}>
            <div className="tag" style={{ borderColor: 'rgba(255,193,7,0.5)', color: '#ffd54f' }}>
              📅 No classes scheduled for {selectedDay}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && Object.keys(timetable).length === 0 && (
          <div className="card" style={{
            background: 'rgba(147,197,253,0.05)',
            borderColor: 'rgba(147,197,253,0.2)',
            textAlign: 'center',
            padding: 40
          }}>
            <h4 style={{ marginBottom: 12, color: '#bfdbfe' }}>📚 No Timetable Yet</h4>
            <p className="muted" style={{ marginBottom: 20 }}>
              Your timetable hasn't been created yet. Please create entries or contact admin.
            </p>
          </div>
        )}

        {/* Weekly Summary */}
        {!loading && Object.keys(timetable).length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 12 }}>📊 Weekly Summary</h4>
            <div className="grid grid-2" style={{ gap: 12 }}>
              {DAYS_ORDER.map(day => (
                <div
                  key={day}
                  style={{
                    padding: 12,
                    background: timetable[day] ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: `1px solid ${timetable[day] ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong>{day}</strong>
                    <span className="muted">
                      {timetable[day] ? `${timetable[day].length} periods` : 'No classes'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MotionFade>
  )
}