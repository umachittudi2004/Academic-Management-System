import { useState, useEffect } from 'react'
import { timetableApi } from '../api/timetable'
import { useAuth } from '../state/AuthContext.jsx'
import MotionFade from '../components/motion/MotionFade.jsx'

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentTimetable() {
  const { user } = useAuth()
  const [timetable, setTimetable] = useState({})
  const [studentInfo, setStudentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selectedDay, setSelectedDay] = useState('Monday')

  useEffect(() => {
    const fetchTimetable = async () => {
      setLoading(true)
      setErr('')
      try {
        const { data } = await timetableApi.getStudentTimetable()
        setTimetable(data.timetable || {})
        setStudentInfo(data.studentInfo)
      } catch (error) {
        setErr(error?.response?.data?.message || 'Failed to fetch timetable')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimetable()
  }, [])

  // Set current day as default
  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const today = days[new Date().getDay()]
    if (DAYS_ORDER.includes(today)) {
      setSelectedDay(today)
    }
  }, [])

  const getTotalPeriods = () => {
    return Object.values(timetable).flat().length
  }

  const getPeriodsByDay = (day) => {
    return timetable[day]?.length || 0
  }

  const getCurrentPeriod = () => {
    const now = new Date()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const currentDay = days[now.getDay()]
    const currentTime = now.toTimeString().slice(0, 5)

    if (!timetable[currentDay]) return null

    return timetable[currentDay].find(entry => 
      entry.startTime <= currentTime && entry.endTime >= currentTime
    )
  }

  const currentPeriod = getCurrentPeriod()

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        {/* Header */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3>My Class Timetable</h3>
              {studentInfo && (
                <div className="muted">
                  Year {studentInfo.year} • {studentInfo.branch} • Section {studentInfo.section}
                </div>
              )}
            </div>
            <div className="tag" style={{ borderColor: 'rgba(108,154,255,0.4)', color: '#bfdbfe' }}>
              📚 {getTotalPeriods()} periods/week
            </div>
          </div>
        </div>

        {/* Current Period Alert */}
        {currentPeriod && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)',
            borderColor: 'rgba(34,197,94,0.4)'
          }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ color: '#c6ffda', marginBottom: 8 }}>
                  🟢 Current Period
                </h4>
                <div style={{ fontSize: '1.05rem', marginBottom: 4 }}>
                  <strong>{currentPeriod.subjectId.subjectCode}</strong> - {currentPeriod.subjectId.subjectName}
                </div>
                <div className="muted" style={{ fontSize: '0.875rem' }}>
                  Period {currentPeriod.periodNumber} • {currentPeriod.startTime} - {currentPeriod.endTime}
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <span className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                  👨‍🏫 {currentPeriod.facultyId.name}
                </span>
                {currentPeriod.roomNumber && (
                  <span className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                    🚪 {currentPeriod.roomNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

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
                  {day.slice(0, 3)}
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
              📅 {selectedDay}
              <span className="muted" style={{ fontSize: '0.875rem', marginLeft: 12 }}>
                ({timetable[selectedDay].length} periods)
              </span>
            </h4>

            <div className="grid" style={{ gap: 12 }}>
              {timetable[selectedDay]
                .sort((a, b) => a.periodNumber - b.periodNumber)
                .map((entry, index) => {
                  const isCurrentPeriod = currentPeriod && currentPeriod._id === entry._id
                  
                  return (
                    <div key={entry._id}>
                      <div className="card" style={{
                        background: isCurrentPeriod 
                          ? 'rgba(34,197,94,0.1)' 
                          : 'rgba(147,197,253,0.05)',
                        border: isCurrentPeriod 
                          ? '2px solid rgba(34,197,94,0.4)' 
                          : '1px solid rgba(147,197,253,0.2)',
                        padding: 16
                      }}>
                        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                          <div className="row" style={{ gap: 12 }}>
                            <div style={{
                              background: isCurrentPeriod 
                                ? 'rgba(34,197,94,0.2)' 
                                : 'rgba(108,154,255,0.2)',
                              borderRadius: 8,
                              padding: '8px 12px',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              color: isCurrentPeriod ? '#c6ffda' : '#bfdbfe',
                              minWidth: 60,
                              textAlign: 'center'
                            }}>
                              {isCurrentPeriod && '🟢 '}P{entry.periodNumber}
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
                        </div>

                        <div style={{
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: 8,
                          padding: 12
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
                              👨‍🏫 {entry.facultyId.name}
                            </span>
                            {entry.roomNumber && (
                              <span className="tag" style={{ fontSize: '0.75rem', borderColor: 'rgba(108,154,255,0.4)', color: '#bfdbfe' }}>
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
                  )
                })}
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
            <div className="muted" style={{ marginTop: 12, fontSize: '0.875rem' }}>
              Enjoy your day off! 🎉
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
            <h4 style={{ marginBottom: 12, color: '#bfdbfe' }}>📚 No Timetable Available</h4>
            <p className="muted">
              Your class timetable hasn't been created yet. Please contact your class coordinator.
            </p>
          </div>
        )}

        {/* Weekly Summary */}
        {!loading && Object.keys(timetable).length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 12 }}>📊 Weekly Schedule</h4>
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
                      {timetable[day] ? `${timetable[day].length} periods` : 'Holiday'}
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