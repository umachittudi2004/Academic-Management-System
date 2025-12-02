import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { groupsApi } from '../api/groups'
import { useAuth } from '../state/AuthContext'
import { socketClient } from '../socket/socket'
import CreateGroupModal from '../components/groups/CreateGroupModal.jsx'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function Groups() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchGroups()

    // Listen for group events
    socketClient.on('group_created', handleGroupCreated)
    socketClient.on('added_to_group', handleAddedToGroup)
    socketClient.on('removed_from_group', handleRemovedFromGroup)
    socketClient.on('group_deleted', handleGroupDeleted)
    socketClient.on('group_message', handleGroupMessage)
    socketClient.on('message_deleted', handleMessageDeleted)

    return () => {
      socketClient.off('group_created')
      socketClient.off('added_to_group')
      socketClient.off('removed_from_group')
      socketClient.off('group_deleted')
      socketClient.off('group_message')
      socketClient.off('message_deleted')
    }
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    setErr('')
    try {
      let response
      if (role === 'faculty') {
        response = await groupsApi.getFacultyGroups()
      } else {
        response = await groupsApi.getStudentGroups()
      }
      setGroups(response.data.groups || [])
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch groups')
    } finally {
      setLoading(false)
    }
  }

  // Socket event handlers
  const handleGroupCreated = (data) => {
    console.log('📢 Group created:', data)
    fetchGroups()
  }

  const handleAddedToGroup = (data) => {
    console.log('👥 Added to group:', data)
    fetchGroups()
    showNotification('Added to Group', `You were added to ${data.groupName}`)
  }

  const handleRemovedFromGroup = (data) => {
    console.log('❌ Removed from group:', data)
    fetchGroups()
    showNotification('Removed from Group', `You were removed from ${data.groupName}`)
  }

  const handleGroupDeleted = (data) => {
    console.log('🗑️ Group deleted:', data)
    fetchGroups()
    showNotification('Group Deleted', `${data.groupName} has been deleted`)
  }

  const handleGroupMessage = (data) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group._id === data.groupId
          ? {
            ...group,
            unreadCount: (group.unreadCount || 0) + 1,
            stats: {
              ...group.stats,
              messageCount: (group.stats?.messageCount || 0) + 1  // ← INCREMENT
            }
          }
          : group
      )
    )
  }

  // Handle message deletion - only update count
  const handleMessageDeleted = (data) => {
    console.log('🗑️ Message deleted:', data)

    // Just update message count
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group._id === data.groupId
          ? {
            ...group,
            stats: {
              ...group.stats,
              messageCount: data.newMessageCount
            }
          }
          : group
      )
    )
  }

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
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

  const openGroup = (groupId) => {
    navigate(`/${role}/groups/${groupId}`)
  }

  const totalUnread = groups.reduce((sum, group) => sum + (group.unreadCount || 0), 0)

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        {/* Header */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3>👥 My Groups</h3>
              <div className="muted" style={{ marginTop: 4 }}>
                {groups.length} group{groups.length !== 1 ? 's' : ''}
                {totalUnread > 0 && ` • ${totalUnread} unread message${totalUnread !== 1 ? 's' : ''}`}
              </div>
            </div>

            {role === 'faculty' && (
              <button
                className="btn"
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '10px 20px' }}
              >
                ➕ Create Group
              </button>
            )}
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
            <div className="muted">Loading groups...</div>
          </div>
        )}

        {/* Groups List */}
        {!loading && groups.length > 0 && (
          <div className="grid" style={{ gap: 12 }}>
            {groups.map(group => (
              <div
                key={group._id}
                className="card"
                onClick={() => openGroup(group._id)}
                style={{
                  cursor: 'pointer',
                  background: group.unreadCount > 0
                    ? 'rgba(59,130,246,0.05)'
                    : 'rgba(255,255,255,0.02)',
                  borderColor: group.unreadCount > 0
                    ? 'rgba(59,130,246,0.2)'
                    : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(147,197,253,0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = group.unreadCount > 0
                    ? 'rgba(59,130,246,0.2)'
                    : 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      {group.unreadCount > 0 && (
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#60a5fa',
                          flexShrink: 0
                        }} />
                      )}
                      <h4 style={{ fontWeight: group.unreadCount > 0 ? 'bold' : 'normal' }}>
                        {group.name}
                      </h4>
                    </div>

                    {group.description && (
                      <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                        {group.description.length > 100
                          ? group.description.substring(0, 100) + '...'
                          : group.description
                        }
                      </div>
                    )}
                  </div>

                  {group.unreadCount > 0 && (
                    <span style={{
                      background: '#60a5fa',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      alignSelf: 'flex-start'
                    }}>
                      {group.unreadCount}
                    </span>
                  )}
                </div>

                <div className="row" style={{ gap: 16, fontSize: '0.875rem', flexWrap: 'wrap' }}>
                  <div className="muted">
                    👤 {group.stats?.totalMemberCount || group.memberCount || 0} member{((group.stats?.totalMemberCount || group.memberCount || 0) !== 1) ? 's' : ''}
                  </div>
                  <div className="muted">
                    💬 {group.stats?.messageCount || 0} message{(group.stats?.messageCount !== 1) ? 's' : ''}
                  </div>
                  {role === 'faculty' && (
                    <div className="muted">
                      👨‍🏫 Created by you
                    </div>
                  )}
                </div>

                {/* {group.lastMessage?.content && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.875rem'
                  }}>
                    <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                      Last message:
                    </div>
                    <div style={{
                      fontWeight: group.unreadCount > 0 ? '500' : 'normal',
                      color: group.unreadCount > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)'
                    }}>
                      <strong>{group.lastMessage.senderName}:</strong> {group.lastMessage.content}
                    </div>
                    <div className="muted" style={{ fontSize: '0.7rem', marginTop: 4 }}>
                      {formatDate(group.lastMessage.sentAt)}
                    </div>
                  </div>
                )} */}

                {/* {!group.lastMessage?.content && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    No messages yet
                  </div>
                )} */}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && groups.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>👥</div>
            <h4 style={{ marginBottom: 8 }}>No Groups Yet</h4>
            <div className="muted" style={{ marginBottom: 16 }}>
              {role === 'faculty'
                ? 'Create your first group to start collaborating with students'
                : 'You haven\'t been added to any groups yet'
              }
            </div>
            {role === 'faculty' && (
              <button
                className="btn"
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '10px 20px' }}
              >
                ➕ Create Group
              </button>
            )}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              fetchGroups()
              setShowCreateModal(false)
            }}
          />
        )}
      </div>
    </MotionFade>
  )
}