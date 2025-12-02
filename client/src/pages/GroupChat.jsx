import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { groupsApi } from '../api/groups'
import { useAuth } from '../state/AuthContext'
import { socketClient } from '../socket/socket'
import MentionInput from '../components/messages/MentionInput.jsx'
import MotionFade from '../components/motion/MotionFade.jsx'
import GroupManagementPanel from '../components/groups/GroupManagementPanel.jsx'


export default function GroupChat() {
    console.log('🎯 GroupChat component LOADED')
    const { id } = useParams()
    console.log('📍 Group ID from URL:', id)
    const navigate = useNavigate()
    const { user, role } = useAuth()
    console.log('👤 User:', user)
    console.log('🎭 Role:', role)
    const [group, setGroup] = useState(null)
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [showManagement, setShowManagement] = useState(false)
    const [err, setErr] = useState('')
    const [msg, setMsg] = useState('')

    // Message input
    const [messageContent, setMessageContent] = useState('')
    const [attachments, setAttachments] = useState([])

    // Mentions
    const [mentionedUsers, setMentionedUsers] = useState([])

    // Typing indicators
    const [typingUsers, setTypingUsers] = useState([])
    const typingTimeoutRef = useRef(null)

    // Search
    const [showSearch, setShowSearch] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)

    // Refs
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        fetchGroupDetails()
        fetchMessages()

        // Join group room
        socketClient.emit('join_group', id)

        // Listen for events
        socketClient.on('group_message', handleNewMessage)
        socketClient.on('user_typing_in_group', handleTyping)
        socketClient.on('message_deleted', handleMessageDeleted)
        socketClient.on('member_removed', handleMemberRemoved)
        socketClient.on('group_deleted', handleGroupDeleted)

        return () => {
            socketClient.emit('leave_group', id)
            socketClient.off('group_message')
            socketClient.off('user_typing_in_group')
            socketClient.off('message_deleted')
            socketClient.off('member_removed')
            socketClient.off('group_deleted')
        }
    }, [id])

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchGroupDetails = async () => {
        try {
            const { data } = await groupsApi.getDetails(id)
            setGroup(data.group)
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to fetch group')
        }
    }

    const fetchMessages = async () => {
        setLoading(true)
        setErr('')
        try {
            const { data } = await groupsApi.getMessages(id, { limit: 50 })
            setMessages(data.messages || [])
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to fetch messages')
        } finally {
            setLoading(false)
        }
    }

    // Socket event handlers
    const handleNewMessage = (data) => {
        if (data.groupId === id) {
            console.log('📨 New group message received:', data)

            // Check if message already exists (avoid duplicates)
            setMessages(prev => {
                const exists = prev.some(m => m._id === data.messageId)
                if (exists) {
                    console.log('Message already exists, skipping')
                    return prev
                }

                // Construct full message object from socket data
                const newMessage = {
                    _id: data.messageId,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    content: data.content,
                    mentions: data.mentions || [],
                    attachments: data.attachments || [],
                    createdAt: data.createdAt,
                    groupId: data.groupId
                }

                console.log('Adding new message to list')
                return [...prev, newMessage]
            })

            // Scroll to bottom smoothly
            setTimeout(() => scrollToBottom(), 100)
        }
    }


    const handleTyping = (data) => {
        if (data.groupId === id && data.userId !== user._id) {
            if (data.isTyping) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.userId === data.userId)) {
                        return [...prev, { userId: data.userId, userName: data.userName }]
                    }
                    return prev
                })
            } else {
                setTypingUsers(prev => prev.filter(u => u.userId !== data.userId))
            }
        }
    }

    const handleMessageDeleted = (data) => {
        if (data.groupId === id) {
            setMessages(prev => prev.filter(m => m._id !== data.messageId))

            // Simple update: just decrement count
            if (data.newMessageCount !== undefined) {
                setGroup(prev => ({
                    ...prev,
                    stats: {
                        ...prev.stats,
                        messageCount: data.newMessageCount
                    }
                }))
            }
        }
    }

    const handleMemberRemoved = (data) => {
        if (data.groupId === id && data.removedMember.userId === user._id) {
            alert('You have been removed from this group')
            navigate(`/${role}/groups`)
        }
    }

    const handleGroupDeleted = (data) => {
        if (data.groupId === id) {
            alert('This group has been deleted')
            navigate(`/${role}/groups`)
        }
    }

    // Handle mention selection
    const handleMentionSelect = (member) => {
        if (!mentionedUsers.find(u => u.userId === member.userId)) {
            setMentionedUsers([...mentionedUsers, member])
        }
    }

    // Handle typing indicator
    const handleInputChange = (value) => {
        // Send typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        groupsApi.sendTyping(id, true).catch(() => { })

        typingTimeoutRef.current = setTimeout(() => {
            groupsApi.sendTyping(id, false).catch(() => { })
        }, 3000)
    }

    // Handle file selection
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
    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault()

        if (!messageContent.trim() && attachments.length === 0) {
            setErr('Please enter a message or attach a file')
            return
        }

        const contentToSend = messageContent.trim() || ' '
        setSending(true)
        setErr('')
        setMsg('')

        try {
            // Extract mentions from message content
            const mentionRegex = /@(\w+(?:\s+\w+)*)/g
            const foundMentions = []
            let match

            while ((match = mentionRegex.exec(messageContent)) !== null) {
                const mentionedName = match[1]
                const member = group.members?.find(m =>
                    m.userName.toLowerCase() === mentionedName.toLowerCase()
                )

                if (member && !foundMentions.find(fm => fm.userId === member.userId)) {
                    foundMentions.push({
                        userId: member.userId,
                        userName: member.userName,
                        userType: member.userType,
                        position: match.index
                    })
                }
            }

            const formData = new FormData()
            formData.append('groupId', id)
            formData.append('content', contentToSend)
            formData.append('mentions', JSON.stringify(foundMentions))

            attachments.forEach(att => {
                formData.append('attachments', att.file)
            })

            // Send message to backend
            const response = await groupsApi.sendMessage(id, formData)

            console.log('✅ Message sent, response:', response.data)

            // Add message to local state immediately (optimistic update)
            const newMessage = response.data.data
            setMessages(prev => [...prev, newMessage])

            // ✅ UPDATE: Also update group stats locally
            setGroup(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    messageCount: (prev.stats?.messageCount || 0) + 1
                }
            }))

            // Clear input
            setMessageContent('')
            setAttachments([])
            setMentionedUsers([])

            // Stop typing indicator
            groupsApi.sendTyping(id, false).catch(() => { })

            // Scroll to bottom
            setTimeout(() => scrollToBottom(), 100)

        } catch (error) {
            console.error('❌ Send message error:', error)
            setErr(error?.response?.data?.message || 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

    // Render message content with highlighted mentions
    const renderMessageContent = (message) => {
        if (!message.mentions || message.mentions.length === 0) {
            return message.content
        }

        const parts = []
        let lastIndex = 0

        // Sort mentions by position
        const sortedMentions = [...message.mentions].sort((a, b) => a.position - b.position)

        sortedMentions.forEach((mention, idx) => {
            // Add text before mention
            if (mention.position > lastIndex) {
                parts.push(
                    <span key={`text-${idx}`}>
                        {message.content.substring(lastIndex, mention.position)}
                    </span>
                )
            }

            // Add highlighted mention
            const mentionText = `@${mention.userName}`
            const mentionEnd = mention.position + mentionText.length

            const isMentionedUser = mention.userId === user._id

            parts.push(
                <span
                    key={`mention-${idx}`}
                    style={{
                        background: isMentionedUser
                            ? 'rgba(251,191,36,0.3)'
                            : 'rgba(59,130,246,0.3)',
                        color: isMentionedUser ? '#fbbf24' : '#60a5fa',
                        padding: '2px 4px',
                        borderRadius: 4,
                        fontWeight: '500'
                    }}
                    title={mention.userName}
                >
                    {mentionText}
                </span>
            )

            lastIndex = mentionEnd
        })

        // Add remaining text
        if (lastIndex < message.content.length) {
            parts.push(
                <span key="text-end">
                    {message.content.substring(lastIndex)}
                </span>
            )
        }

        return parts
    }

    // Search messages
    const handleSearch = async () => {
        if (!searchTerm.trim()) return

        setSearching(true)
        try {
            const { data } = await groupsApi.searchMessages(id, searchTerm)
            setSearchResults(data.results || [])
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setSearching(false)
        }
    }

    // Delete message
    // Delete message
    // Delete message
    const handleDeleteMessage = async (messageId) => {
        if (!confirm('Delete this message?')) return

        try {
            await groupsApi.deleteMessage(messageId)

            setMessages(prev => prev.filter(m => m._id !== messageId))

            setGroup(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    messageCount: Math.max(0, (prev.stats?.messageCount || 0) - 1)
                }
            }))

            setMsg('Message deleted')
            setTimeout(() => setMsg(''), 3000)
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to delete message')
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDateSeparator = (dateString) => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }
    }

    const shouldShowDateSeparator = (currentMsg, prevMsg) => {
        if (!prevMsg) return true

        const currentDate = new Date(currentMsg.createdAt).toDateString()
        const prevDate = new Date(prevMsg.createdAt).toDateString()

        return currentDate !== prevDate
    }

    if (loading) {
        return (
            <MotionFade>
                <div className="card">
                    <div className="muted">Loading group...</div>
                </div>
            </MotionFade>
        )
    }

    if (!group) {
        return (
            <MotionFade>
                <div className="card">
                    <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
                        ✕ Group not found
                    </div>
                </div>
            </MotionFade>
        )
    }

    return (
        <MotionFade>
            <div className="grid" style={{ gap: 12 }}>
                {/* Header */}
                <div className="card">
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <button
                                className="btn secondary"
                                onClick={() => navigate(`/${role}/groups`)}
                                style={{ marginBottom: 8, padding: '6px 12px', fontSize: '0.875rem' }}
                            >
                                ← Back to Groups
                            </button>
                            <h3 style={{ marginBottom: 4 }}>{group.name}</h3>
                            {group.description && (
                                <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 4 }}>
                                    {group.description}
                                </div>
                            )}
                            <div className="muted" style={{ fontSize: '0.875rem' }}>
                                👤 {group.stats?.totalMemberCount || group.memberCount || 0} members •
                                💬 {group.stats?.messageCount || 0} messages
                            </div>
                        </div>

                        <div className="row" style={{ gap: 8 }}>
                            <button
                                className="btn secondary"
                                onClick={() => setShowSearch(!showSearch)}
                                style={{ padding: '8px 16px' }}
                            >
                                🔍 Search
                            </button>
                            <button
                                className="btn secondary"
                                onClick={() => setShowManagement(true)}
                                style={{ padding: '8px 16px' }}
                            >
                                ⚙️ Manage
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Panel */}
                {showSearch && (
                    <div className="card">
                        <div className="row" style={{ gap: 12 }}>
                            <input
                                className="input"
                                type="text"
                                placeholder="Search messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="btn"
                                onClick={handleSearch}
                                disabled={searching || !searchTerm.trim()}
                            >
                                {searching ? '🔍 Searching...' : 'Search'}
                            </button>
                        </div>

                        {searchResults.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found:
                                </div>
                                <div className="grid" style={{ gap: 8 }}>
                                    {searchResults.map(result => (
                                        <div
                                            key={result._id}
                                            style={{
                                                padding: 8,
                                                background: 'rgba(59,130,246,0.1)',
                                                borderRadius: 6,
                                                border: '1px solid rgba(59,130,246,0.2)'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: 4 }}>
                                                {result.senderName}
                                            </div>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                {result.content}
                                            </div>
                                            <div className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                                                {formatDate(result.createdAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error/Success Messages */}
                {err && (
                    <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
                        ✕ {err}
                    </div>
                )}
                {msg && (
                    <div className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                        ✓ {msg}
                    </div>
                )}

                {/* Chat Area */}
                <div className="card" style={{ height: 'calc(100vh - 400px)', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                    }}>
                        {messages.length === 0 ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 12
                            }}>
                                <div style={{ fontSize: '3rem' }}>💬</div>
                                <div className="muted">No messages yet. Start the conversation!</div>
                            </div>
                        ) : (
                            messages.map((message, index) => {
                                const isSender = message.senderId === user._id
                                const showDate = shouldShowDateSeparator(message, messages[index - 1])
                                const isMentioned = message.mentions?.some(m => m.userId === user._id)

                                return (
                                    <div key={message._id}>
                                        {/* Date Separator */}
                                        {showDate && (
                                            <div style={{
                                                textAlign: 'center',
                                                margin: '16px 0',
                                                fontSize: '0.75rem',
                                                color: 'rgba(255,255,255,0.4)'
                                            }}>
                                                {formatDateSeparator(message.createdAt)}
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: isSender ? 'flex-end' : 'flex-start'
                                        }}>
                                            <div style={{
                                                maxWidth: '70%',
                                                padding: 12,
                                                borderRadius: 12,
                                                background: isSender
                                                    ? 'rgba(59,130,246,0.2)'
                                                    : isMentioned
                                                        ? 'rgba(251,191,36,0.15)'
                                                        : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isSender
                                                    ? 'rgba(59,130,246,0.3)'
                                                    : isMentioned
                                                        ? 'rgba(251,191,36,0.4)'
                                                        : 'rgba(255,255,255,0.1)'
                                                    }`
                                            }}>
                                                {/* Mention Badge */}
                                                {!isSender && isMentioned && (
                                                    <div style={{
                                                        display: 'inline-block',
                                                        padding: '2px 8px',
                                                        background: 'rgba(251,191,36,0.3)',
                                                        borderRadius: 12,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 'bold',
                                                        color: '#fbbf24',
                                                        marginBottom: 6
                                                    }}>
                                                        📌 You were mentioned
                                                    </div>
                                                )}

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

                                                <div style={{ fontSize: '0.875rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
                                                    {renderMessageContent(message)}
                                                </div>

                                                {/* Attachments */}
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
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginTop: 6,
                                                    gap: 8
                                                }}>
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: 'rgba(255,255,255,0.4)'
                                                    }}>
                                                        {formatDate(message.createdAt)}
                                                    </div>

                                                    {isSender && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(message._id)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: 'rgba(255,107,107,0.7)',
                                                                cursor: 'pointer',
                                                                fontSize: '0.7rem',
                                                                padding: '2px 4px'
                                                            }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div style={{
                            padding: '8px 12px',
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.5)',
                            fontStyle: 'italic'
                        }}>
                            {typingUsers.length === 1
                                ? `${typingUsers[0].userName} is typing...`
                                : typingUsers.length === 2
                                    ? `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`
                                    : `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`
                            }
                        </div>
                    )}

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} style={{
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        padding: 12
                    }}>
                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 6 }}>
                                    Attachments ({attachments.length}):
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
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            <span>📎 {file.fileName} ({(file.size / 1024).toFixed(1)} KB)</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(file.tempId)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    padding: '0 4px'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
                            />

                            <button
                                type="button"
                                className="btn secondary"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ padding: '10px' }}
                                disabled={sending}
                            >
                                📎
                            </button>

                            <MentionInput
                                value={messageContent}
                                onChange={(value) => {
                                    setMessageContent(value)
                                    handleInputChange(value)
                                }}
                                onMentionSelect={handleMentionSelect}
                                members={group.members || []}
                                placeholder="Type @ to mention someone..."
                                disabled={sending || (role === 'student' && !group.settings?.allowStudentMessages)}
                                onKeyPress={handleSendMessage}
                                rows={1}
                            />

                            <button
                                type="submit"
                                className="btn"
                                disabled={sending || (!messageContent.trim() && attachments.length === 0)}
                                style={{ padding: '10px 20px' }}
                            >
                                {sending ? '⏳' : '➤'}
                            </button>
                        </div>

                        {role === 'student' && !group.settings?.allowStudentMessages && (
                            <div className="muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>
                                ⚠️ Only faculty can send messages in this group
                            </div>
                        )}
                    </form>
                </div>

                {/* Group Management Panel */}
                {showManagement && (
                    <GroupManagementPanel
                        group={group}
                        onClose={() => setShowManagement(false)}
                        onUpdate={() => {
                            fetchGroupDetails()
                            fetchMessages()
                        }}
                        onDelete={() => {
                            navigate(`/${role}/groups`)
                        }}
                    />
                )}
            </div>
        </MotionFade>
    )
}