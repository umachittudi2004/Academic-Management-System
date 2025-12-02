import { useState, useEffect, useRef } from 'react'
import { messagesApi } from '../api/messages'
import { socketClient } from '../socket/socket'
import MotionFade from '../components/motion/MotionFade.jsx'
import { useAuth } from '../state/AuthContext.jsx'

export default function Messages() {
  const { user, role } = useAuth()
  const [view, setView] = useState('inbox') // inbox, sent, compose, thread
  const [filter, setFilter] = useState('all') // all, unread, archived
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [threadMessages, setThreadMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  // New message form
  const [showCompose, setShowCompose] = useState(false)
  const [recipientList, setRecipientList] = useState([])
  const [selectedRecipient, setSelectedRecipient] = useState(null)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [priority, setPriority] = useState('normal')

  // Broadcast form (faculty only)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastYear, setBroadcastYear] = useState('')
  const [broadcastBranch, setBroadcastBranch] = useState('CSE-DS')
  const [broadcastSection, setBroadcastSection] = useState('')

  // Refs
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Connect socket on mount
  useEffect(() => {
    if (user) {
      socketClient.connect(user._id)

      // Listen for new messages
      socketClient.on('new_message', handleNewMessage)
      socketClient.on('new_broadcast', handleNewBroadcast)
      socketClient.on('message_read', handleMessageRead)
    }

    return () => {
      socketClient.removeAllListeners()
    }
  }, [user])

  // Fetch data on mount
  useEffect(() => {
    fetchUnreadCount()
    if (view === 'inbox') {
      fetchInbox()
    } else if (view === 'sent') {
      fetchSent()
    }
  }, [view, filter])

  // Fetch recipient list
  useEffect(() => {
    if (showCompose) {
      fetchRecipients()
    }
  }, [showCompose])

  // Socket event handlers
  const handleNewMessage = (data) => {
    console.log('📨 New message received:', data)
    setUnreadCount(prev => prev + 1)
    
    // Show notification
    showNotification('New Message', `From ${data.senderName}: ${data.content}`)
    
    // Refresh inbox if currently viewing
    if (view === 'inbox') {
      fetchInbox()
    }

    // Update thread if currently open
    if (selectedThread && data.threadId === selectedThread._id) {
      fetchThread(selectedThread._id)
    }
  }

  const handleNewBroadcast = (data) => {
    console.log('📢 New broadcast received:', data)
    setUnreadCount(prev => prev + 1)
    showNotification('Class Announcement', `From ${data.senderName}: ${data.content}`)
    
    if (view === 'inbox') {
      fetchInbox()
    }
  }

  const handleMessageRead = (data) => {
    console.log('✓ Message read:', data)
    // Update read status in UI if needed
  }

  // Browser notifications
  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' })
    }
  }

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Fetch functions
  const fetchUnreadCount = async () => {
    try {
      const { data } = await messagesApi.getUnreadCount()
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch unread count')
    }
  }

  const fetchInbox = async () => {
    setLoading(true)
    setErr('')
    try {
      const { data } = await messagesApi.getInbox(filter)
      setMessages(data.messages || [])
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch inbox')
    } finally {
      setLoading(false)
    }
  }

  const fetchSent = async () => {
    setLoading(true)
    setErr('')
    try {
      const { data } = await messagesApi.getSent()
      setMessages(data.messages || [])
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch sent messages')
    } finally {
      setLoading(false)
    }
  }

  const fetchThread = async (threadId) => {
    setLoading(true)
    setErr('')
    try {
      const { data } = await messagesApi.getThread(threadId)
      setSelectedThread(data.conversation)
      setThreadMessages(data.messages || [])
      setView('thread')

      // Mark messages as read
      const unreadMessages = data.messages.filter(m => 
        !m.isRead && m.recipientId === user._id
      )
      
      for (const message of unreadMessages) {
        await messagesApi.markAsRead(message._id)
      }

      fetchUnreadCount()
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch thread')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipients = async () => {
    try {
      if (role === 'faculty') {
        // Faculty gets student list
        const { data } = await messagesApi.getStudents({})
        setRecipientList(data.students || [])
      } else {
        // Student gets faculty list
        const { data } = await messagesApi.getFacultyList()
        setRecipientList(data.faculties || [])
      }
    } catch (error) {
      console.error('Failed to fetch recipients')
    }
  }

  // Handle file upload
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const fileObjects = files.map(file => ({
      fileName: file.name,
      file: file,
      size: file.size,
      tempId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }))

    setAttachments([...attachments, ...fileObjects])
  }

  const removeAttachment = (tempId) => {
    setAttachments(attachments.filter(f => f.tempId !== tempId))
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!selectedRecipient || !subject || !content) {
      setErr('Please fill all required fields')
      return
    }

    setSending(true)
    setErr('')
    setMsg('')

    try {
      const formData = new FormData()
      formData.append('recipientId', selectedRecipient._id)
      formData.append('recipientType', role === 'faculty' ? 'Student' : 'Faculty')
      formData.append('subject', subject)
      formData.append('content', content)
      formData.append('priority', priority)

      attachments.forEach(att => {
        formData.append('attachments', att.file)
      })

      await messagesApi.send(formData)

      setMsg('Message sent successfully!')
      
      setTimeout(() => {
        resetComposeForm()
        setView('sent')
        fetchSent()
      }, 1500)
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Broadcast message (faculty only)
  const handleBroadcast = async (e) => {
    e.preventDefault()

    if (!broadcastYear || !broadcastSection || !subject || !content) {
      setErr('Please fill all required fields')
      return
    }

    setSending(true)
    setErr('')
    setMsg('')

    try {
      const formData = new FormData()
      formData.append('year', broadcastYear)
      formData.append('branch', broadcastBranch)
      formData.append('section', broadcastSection)
      formData.append('subject', subject)
      formData.append('content', content)
      formData.append('priority', priority)

      attachments.forEach(att => {
        formData.append('attachments', att.file)
      })

      const { data } = await messagesApi.broadcast(formData)

      setMsg(`Broadcast sent to ${data.recipientCount} students!`)
      
      setTimeout(() => {
        resetComposeForm()
        setShowBroadcast(false)
        setView('sent')
        fetchSent()
      }, 2000)
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  // Reply to message
  const handleReply = (message) => {
    setSelectedRecipient({
      _id: message.senderId,
      name: message.senderName
    })
    setSubject(`Re: ${message.subject}`)
    setShowCompose(true)
  }

  // Reset forms
  const resetComposeForm = () => {
    setSelectedRecipient(null)
    setSubject('')
    setContent('')
    setAttachments([])
    setPriority('normal')
    setShowCompose(false)
    setBroadcastYear('')
    setBroadcastSection('')
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Priority badge
  const getPriorityStyle = (priority) => {
    switch(priority) {
      case 'urgent':
        return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5', label: '🔴 Urgent' }
      case 'high':
        return { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fde047', label: '🟡 High' }
      default:
        return null
    }
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        {/* Header */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3>📨 Messages</h3>
              {unreadCount > 0 && (
                <div className="muted" style={{ marginTop: 4 }}>
                  {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="row" style={{ gap: 8 }}>
              {role === 'faculty' && (
                <button
                  className="btn"
                  onClick={() => setShowBroadcast(true)}
                  style={{
                    background: 'rgba(168,85,247,0.2)',
                    borderColor: 'rgba(168,85,247,0.4)',
                    padding: '8px 16px'
                  }}
                >
                  📢 Broadcast
                </button>
              )}
              <button
                className="btn"
                onClick={() => setShowCompose(true)}
                style={{ padding: '8px 16px' }}
              >
                ✉️ New Message
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="card">
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {['inbox', 'sent'].map(v => (
              <button
                key={v}
                className="btn"
                onClick={() => setView(v)}
                style={{
                  background: view === v ? 'rgba(108,154,255,0.3)' : 'rgba(147,197,253,0.1)',
                  borderColor: view === v ? 'rgba(108,154,255,0.6)' : 'rgba(147,197,253,0.3)',
                  color: view === v ? '#bfdbfe' : 'rgba(255,255,255,0.7)',
                  padding: '8px 16px',
                  fontSize: '0.875rem'
                }}
              >
                {v === 'inbox' ? `📥 Inbox ${unreadCount > 0 ? `(${unreadCount})` : ''}` : '📤 Sent'}
              </button>
            ))}

            {view === 'inbox' && (
              <>
                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                {['all', 'unread', 'archived'].map(f => (
                  <button
                    key={f}
                    className="btn"
                    onClick={() => setFilter(f)}
                    style={{
                      background: filter === f ? 'rgba(59,130,246,0.2)' : 'transparent',
                      borderColor: filter === f ? 'rgba(59,130,246,0.4)' : 'rgba(147,197,253,0.2)',
                      color: filter === f ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                      padding: '6px 12px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {err && !showCompose && !showBroadcast && (
          <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
            ✕ {err}
          </div>
        )}

        {/* Loading */}
        {loading && view !== 'thread' && (
          <div className="card">
            <div className="muted">Loading messages...</div>
          </div>
        )}

        {/* Messages List */}
        {!loading && view !== 'thread' && messages.length > 0 && (
          <div className="grid" style={{ gap: 8 }}>
            {messages.map(message => {
              const priorityStyle = getPriorityStyle(message.priority)

              return (
                <div
                  key={message._id}
                  className="card"
                  onClick={() => message.threadId && fetchThread(message.threadId)}
                  style={{
                    cursor: message.threadId ? 'pointer' : 'default',
                    background: !message.isRead && view === 'inbox' 
                      ? 'rgba(59,130,246,0.05)' 
                      : 'rgba(255,255,255,0.02)',
                    borderColor: !message.isRead && view === 'inbox'
                      ? 'rgba(59,130,246,0.2)'
                      : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(147,197,253,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = !message.isRead && view === 'inbox'
                      ? 'rgba(59,130,246,0.2)'
                      : 'rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        {!message.isRead && view === 'inbox' && (
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            background: '#60a5fa',
                            flexShrink: 0
                          }} />
                        )}
                        <span style={{ fontWeight: !message.isRead ? 'bold' : 'normal' }}>
                          {message.isBroadcast 
                            ? '📢 ' + message.senderName 
                            : (view === 'inbox' ? message.senderName : message.recipientName)
                          }
                        </span>
                        {priorityStyle && (
                          <span 
                            className="tag" 
                            style={{ 
                              fontSize: '0.65rem',
                              borderColor: priorityStyle.border,
                              color: priorityStyle.color,
                              background: priorityStyle.bg,
                              padding: '2px 6px'
                            }}
                          >
                            {priorityStyle.label}
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: !message.isRead ? '500' : 'normal',
                        marginBottom: 4
                      }}>
                        {message.subject}
                      </div>
                      <div className="muted" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                        {message.content.length > 100 
                          ? message.content.substring(0, 100) + '...'
                          : message.content
                        }
                      </div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="muted" style={{ fontSize: '0.7rem', marginTop: 4 }}>
                          📎 {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgba(255,255,255,0.5)',
                      whiteSpace: 'nowrap',
                      marginLeft: 12
                    }}>
                      {formatDate(message.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && messages.length === 0 && view !== 'thread' && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div className="muted">
              {view === 'inbox' 
                ? filter === 'unread'
                  ? 'No unread messages'
                  : 'No messages in inbox'
                : 'No sent messages'
              }
            </div>
          </div>
        )}

        {/* Thread View */}
        {view === 'thread' && selectedThread && (
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <button
                  className="btn secondary"
                  onClick={() => {
                    setView('inbox')
                    setSelectedThread(null)
                    setThreadMessages([])
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.875rem', marginBottom: 8 }}
                >
                  ← Back
                </button>
                <div style={{ fontWeight: 'bold', marginTop: 4 }}>
                  {selectedThread.participants.find(p => p.userId !== user._id)?.userName || 'Unknown'}
                </div>
              </div>
            </div>

            <div style={{ 
              maxHeight: '500px', 
              overflowY: 'auto',
              padding: '12px 0'
            }}>
              {threadMessages.map((message, index) => {
                const isSender = message.senderId === user._id
                const showDate = index === 0 || 
                  new Date(message.createdAt).toDateString() !== 
                  new Date(threadMessages[index - 1].createdAt).toDateString()

                return (
                  <div key={message._id}>
                    {showDate && (
                      <div style={{ 
                        textAlign: 'center', 
                        margin: '16px 0',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.4)'
                      }}>
                        {new Date(message.createdAt).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: isSender ? 'flex-end' : 'flex-start',
                      marginBottom: 12
                    }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: 12,
                        borderRadius: 12,
                        background: isSender 
                          ? 'rgba(59,130,246,0.2)' 
                          : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isSender ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`
                      }}>
                        {!isSender && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            marginBottom: 4,
                            color: '#93c5fd'
                          }}>
                            {message.senderName}
                          </div>
                        )}
                        <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                          {message.content}
                        </div>
                        {message.attachments && message.attachments.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {message.attachments.map((file, idx) => (
                              <a
                                key={idx}
                                href={file.googleDriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'block',
                                  fontSize: '0.75rem',
                                  color: '#93c5fd',
                                  textDecoration: 'none',
                                  marginTop: 4
                                }}
                              >
                                📎 {file.fileName}
                              </a>
                            ))}
                          </div>
                        )}
                        <div style={{ 
                          fontSize: '0.65rem', 
                          marginTop: 6,
                          color: 'rgba(255,255,255,0.4)',
                          textAlign: isSender ? 'right' : 'left'
                        }}>
                          {new Date(message.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {isSender && message.isRead && ' ✓✓'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Box */}
            <div style={{ 
              marginTop: 16, 
              paddingTop: 16, 
              borderTop: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <form onSubmit={(e) => {
                e.preventDefault()
                const otherParticipant = selectedThread.participants.find(p => p.userId !== user._id)
                setSelectedRecipient({
                  _id: otherParticipant.userId,
                  name: otherParticipant.userName
                })
                setSubject(`Re: ${threadMessages[0]?.subject || 'No subject'}`)
                setShowCompose(true)
              }}>
                <button 
                  type="submit"
                  className="btn" 
                  style={{ width: '100%', padding: '10px' }}
                >
                  ↩️ Reply
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Compose Modal */}
        {showCompose && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}>
            <div className="card" style={{
              maxWidth: 700,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h4 style={{ marginBottom: 16 }}>✉️ New Message</h4>

              <form onSubmit={handleSendMessage}>
                {/* Recipient */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    To: *
                  </label>
                  {selectedRecipient ? (
                    <div style={{
                      padding: 8,
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: 6,
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span>{selectedRecipient.name}</span>
                        <button
                          type="button"
                          className="btn danger"
                          onClick={() => setSelectedRecipient(null)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      className="input"
                      onChange={(e) => {
                        const recipient = recipientList.find(r => r._id === e.target.value)
                        setSelectedRecipient(recipient)
                      }}
                      required
                    >
                      <option value="">-- Select Recipient --</option>
                      {recipientList.map(recipient => (
                        <option key={recipient._id} value={recipient._id}>
                          {recipient.name} {recipient.rollno ? `(${recipient.rollno})` : `(${recipient.empId})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Subject: *
                  </label>
                  <input
                    className="input"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject"
                    required
                    maxLength={200}
                  />
                </div>

                {/* Content */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Message: *
                  </label>
                  <textarea
                    className="input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your message..."
                    required
                    rows={8}
                    maxLength={5000}
                  />
                  <div className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                    {content.length}/5000 characters
                  </div>
                </div>

                {/* Priority */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Priority:
                  </label>
                  <div className="row" style={{ gap: 8 }}>
                    {['normal', 'high', 'urgent'].map(p => (
                      <button
                        key={p}
                        type="button"
                        className="btn"
                        onClick={() => setPriority(p)}
                        style={{
                          background: priority === p ? 'rgba(59,130,246,0.2)' : 'transparent',
                          borderColor: priority === p ? 'rgba(59,130,246,0.4)' : 'rgba(147,197,253,0.2)',
                          padding: '6px 12px',
                          fontSize: '0.875rem'
                        }}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Attachments:
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="message-file-upload"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
                  />
                  <label
                    htmlFor="message-file-upload"
                    className="btn secondary"
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    📎 Attach Files
                  </label>

                  {attachments.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 6 }}>
                        Selected files ({attachments.length}/3):
                      </div>
                      <div className="grid" style={{ gap: 6 }}>
                        {attachments.map(file => (
                          <div
                            key={file.tempId}
                            className="row"
                            style={{
                              padding: 6,
                              background: 'rgba(34,197,94,0.1)',
                              borderRadius: 6,
                              border: '1px solid rgba(34,197,94,0.2)',
                              justifyContent: 'space-between',
                              fontSize: '0.875rem'
                            }}
                          >
                            <span>📄 {file.fileName} ({(file.size / 1024).toFixed(1)} KB)</span>
                            <button
                              type="button"
                              className="btn danger"
                              onClick={() => removeAttachment(file.tempId)}
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg && (
                  <div className="tag" style={{ marginBottom: 16, borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                    ✓ {msg}
                  </div>
                )}
                {err && (
                  <div className="tag" style={{ marginBottom: 16, borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
                    ✕ {err}
                  </div>
                )}

                <div className="row" style={{ gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      resetComposeForm()
                    }}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    disabled={sending}
                  >
                    {sending ? '📤 Sending...' : '✉️ Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Broadcast Modal */}
        {showBroadcast && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}>
            <div className="card" style={{
              maxWidth: 700,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h4 style={{ marginBottom: 16 }}>📢 Broadcast to Class</h4>

              <form onSubmit={handleBroadcast}>
                {/* Target Class */}
                <div style={{ 
                  marginBottom: 16,
                  padding: 12,
                  background: 'rgba(168,85,247,0.1)',
                  borderRadius: 8,
                  border: '1px solid rgba(168,85,247,0.2)'
                }}>
                  <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                    Send To:
                  </div>
                  <div className="grid grid-2" style={{ gap: 12 }}>
                    <div>
                      <label className="muted" style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem' }}>
                        Year *
                      </label>
                      <select
                        className="input"
                        value={broadcastYear}
                        onChange={(e) => setBroadcastYear(e.target.value)}
                        required
                      >
                        <option value="">-- Select --</option>
                        {[1, 2, 3, 4].map(y => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="muted" style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem' }}>
                        Branch *
                      </label>
                      <input
                        className="input"
                        value={broadcastBranch}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="muted" style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem' }}>
                        Section *
                      </label>
                      <select
                        className="input"
                        value={broadcastSection}
                        onChange={(e) => setBroadcastSection(e.target.value)}
                        required
                      >
                        <option value="">-- Select --</option>
                        {['A', 'B', 'C'].map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Subject: *
                  </label>
                  <input
                    className="input"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Class Postponement Notice"
                    required
                    maxLength={200}
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Message: *
                  </label>
                  <textarea
                    className="input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your announcement..."
                    required
                    rows={8}
                    maxLength={5000}
                  />
                </div>

                {/* Priority */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Priority:
                  </label>
                  <div className="row" style={{ gap: 8 }}>
                    {['normal', 'high', 'urgent'].map(p => (
                      <button
                        key={p}
                        type="button"
                        className="btn"
                        onClick={() => setPriority(p)}
                        style={{
                          background: priority === p ? 'rgba(168,85,247,0.2)' : 'transparent',
                          borderColor: priority === p ? 'rgba(168,85,247,0.4)' : 'rgba(147,197,253,0.2)',
                          padding: '6px 12px',
                          fontSize: '0.875rem'
                        }}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Attachments (Optional):
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="broadcast-file-upload"
                  />
                  <label
                    htmlFor="broadcast-file-upload"
                    className="btn secondary"
                    style={{ cursor: 'pointer', padding: '8px 16px' }}
                  >
                    📎 Attach Files
                  </label>

                  {attachments.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {attachments.map(file => (
                        <div
                          key={file.tempId}
                          className="row"
                          style={{
                            padding: 6,
                            background: 'rgba(34,197,94,0.1)',
                            borderRadius: 6,
                            border: '1px solid rgba(34,197,94,0.2)',
                            justifyContent: 'space-between',
                            fontSize: '0.875rem',
                            marginBottom: 6
                          }}
                        >
                          <span>📄 {file.fileName}</span>
                          <button
                            type="button"
                            className="btn danger"
                            onClick={() => removeAttachment(file.tempId)}
                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg && (
                  <div className="tag" style={{ marginBottom: 16, borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                    ✓ {msg}
                  </div>
                )}
                {err && (
                  <div className="tag" style={{ marginBottom: 16, borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
                    ✕ {err}
                  </div>
                )}

                <div className="row" style={{ gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      resetComposeForm()
                      setShowBroadcast(false)
                    }}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    disabled={sending || !broadcastYear || !broadcastSection}
                  >
                    {sending ? '📤 Broadcasting...' : '📢 Send Broadcast'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MotionFade>
  )
}