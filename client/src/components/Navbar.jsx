import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'  // ← Your path
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { messagesApi } from '../api/messages'
import { socketClient } from '../socket/socket'

export default function Navbar() {
  const { role, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread count on mount
  useEffect(() => {
    if (user && role) {
      fetchUnreadCount()

      // Connect socket
      socketClient.connect(user._id)
    }

    return () => {
      // Cleanup on unmount
      if (!user) {
        socketClient.disconnect()
      }
    }
  }, [user, role])

  // Listen for new messages
  useEffect(() => {
    if (user && role) {
      socketClient.on('new_message', handleNewMessage)
      socketClient.on('new_broadcast', handleNewBroadcast)
    }

    return () => {
      socketClient.off('new_message')
      socketClient.off('new_broadcast')
    }
  }, [user, role])

  const handleNewMessage = () => {
    fetchUnreadCount()
  }

  const handleNewBroadcast = () => {
    fetchUnreadCount()
  }

  const fetchUnreadCount = async () => {
    try {
      const { data } = await messagesApi.getUnreadCount()
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    socketClient.disconnect()
    navigate('/login/student')
  }

  return (
    <div className="nav">
      <div className="container nav-inner">
        <motion.div
          className="brand"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          Department Application
        </motion.div>

        <div className="row">
          {!role && (
            <>
              <Link className="btn secondary" to="/login/student">Student Login</Link>
              <Link className="btn secondary" to="/login/faculty">Faculty Login</Link>
            </>
          )}

          {role === 'student' && (
            <>
              <Link className="btn secondary" to="/student">Dashboard</Link>
              <Link className="btn secondary" to="/student/notices">Notice Board</Link>
              <Link className="btn secondary" to="/student/assignments">Assignments</Link>
              <Link
                className="btn secondary"
                to="/student/messages"
                style={{ position: 'relative' }}
              >
                Messages
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    border: '2px solid #1a1a1a'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link className="btn secondary" to="/student/groups">Groups</Link>
              <Link className="btn secondary" to="/student/timetable">Timetable</Link>
              <Link className="btn secondary" to="/student/attendance">Attendance</Link>
              <Link className="btn secondary" to="/student/profile">Profile</Link>
              <button className="btn danger" onClick={handleLogout}>Logout</button>
            </>
          )}

          {role === 'faculty' && (
            <>
              <Link className="btn secondary" to="/faculty">Dashboard</Link>
              <Link className="btn secondary" to="/faculty/notices">Notice</Link>
              <Link className="btn secondary" to="/faculty/assignments">Assignments</Link>
              <Link
                className="btn secondary"
                to="/faculty/messages"
                style={{ position: 'relative' }}
              >
                Messages
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    border: '2px solid #1a1a1a'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link className="btn secondary" to="/faculty/groups">Groups</Link>
              <Link className="btn secondary" to="/faculty/timetable">Timetable</Link>
              <Link className="btn secondary" to="/faculty/timetable/view">View Schedule</Link>
              <Link className="btn secondary" to="/faculty/profile">Profile</Link>
              <button className="btn danger" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>

      <motion.div
        key={location.pathname}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        exit={{ scaleX: 0 }}
        transition={{ duration: 0.25 }}
        style={{ height: 2, background: 'linear-gradient(90deg, #6c9aff, #8ef6ff)', transformOrigin: 'left' }}
      />
    </div>
  )
}