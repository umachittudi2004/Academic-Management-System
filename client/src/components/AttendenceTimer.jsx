import { useState, useEffect } from 'react'

export default function AttendanceTimer({ createdAt, expiresIn = 1800 }) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const created = new Date(createdAt).getTime()
      const expiresAt = created + (expiresIn * 1000) // Convert seconds to milliseconds
      const remaining = Math.floor((expiresAt - now) / 1000) // Convert back to seconds

      if (remaining <= 0) {
        setIsExpired(true)
        setTimeLeft(0)
        return 0
      }

      setTimeLeft(remaining)
      return remaining
    }

    // Initial calculation
    calculateTimeLeft()

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [createdAt, expiresIn])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((expiresIn - timeLeft) / expiresIn) * 100
  }

  const getTimerColor = () => {
    if (timeLeft > 600) return 'rgba(34,197,94,0.4)' // Green > 10 mins
    if (timeLeft > 300) return 'rgba(255,193,7,0.5)' // Yellow > 5 mins
    return 'rgba(255,107,107,0.5)' // Red < 5 mins
  }

  const getTextColor = () => {
    if (timeLeft > 600) return '#c6ffda'
    if (timeLeft > 300) return '#ffd54f'
    return '#ffb0b0'
  }

  if (isExpired) {
    return (
      <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
        ⏰ Session Expired
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="muted" style={{ fontSize: '0.875rem' }}>Time Remaining</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getTextColor() }}>
          {formatTime(timeLeft)}
        </div>
      </div>
      
      {/* Progress bar */}
      <div style={{ 
        width: '100%', 
        height: 8, 
        backgroundColor: 'rgba(255,255,255,0.1)', 
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${100 - getProgressPercentage()}%`,
          height: '100%',
          backgroundColor: getTextColor(),
          transition: 'width 1s linear, background-color 0.3s ease',
          borderRadius: 4
        }} />
      </div>

      <div className="muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>
        {timeLeft > 60 
          ? `${Math.floor(timeLeft / 60)} minute${Math.floor(timeLeft / 60) !== 1 ? 's' : ''} left`
          : 'Less than a minute left!'
        }
      </div>
    </div>
  )
}