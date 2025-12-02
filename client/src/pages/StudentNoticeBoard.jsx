import { useEffect, useState } from 'react'
import { noticesApi } from '../api/notices'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function StudentNoticeBoard() {
  const [notices, setNotices] = useState([])
  const [pinnedNotices, setPinnedNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotice, setSelectedNotice] = useState(null)

  const load = async () => {
    setLoading(true)
    setErr('')
    try {
      const { data } = await noticesApi.getStudentNotices()
      const all = data.notices || []
      setPinnedNotices(all.filter(n => n.isPinned))
      setNotices(all.filter(n => !n.isPinned))

      // Get unread count
      const { data: countData } = await noticesApi.getUnreadCount()
      setUnreadCount(countData.unreadCount || 0)
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch notices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openNotice = async (notice) => {
    try {
      // Fetch full notice details - this will:
      // 1. Increment total view count
      // 2. Track unique student view
      const { data } = await noticesApi.getById(notice._id);
      setSelectedNotice(data.notice);

      // Mark as read (if not already read)
      if (!notice.isRead) {
        try {
          await noticesApi.markAsRead(notice._id);
          // Refresh to update read status
          await load();
        } catch (error) {
          console.error('Failed to mark as read:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notice:', error);
      // Fallback to existing data if fetch fails
      setSelectedNotice(notice);
    }
  };

  const closeNotice = () => {
    setSelectedNotice(null)
  }

  const formatRelativeTime = (date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return new Date(date).toLocaleDateString()
  }

  const NoticeCard = ({ notice }) => {
    const isUnread = !notice.isRead

    return (
      <div
        className="card"
        style={{
          cursor: 'pointer',
          borderLeft: isUnread ? '4px solid rgba(34,197,94,0.6)' : undefined
        }}
        onClick={() => openNotice(notice)}
      >
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            {isUnread && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#22c55e',
                  borderRadius: '50%',
                  display: 'inline-block'
                }}
              />
            )}

            {notice.isUrgent && (
              <span className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
                🔥 Urgent
              </span>
            )}

            <span className="tag" style={{ borderColor: 'rgba(147,197,253,0.4)', color: '#bfdbfe' }}>
              {notice.category}
            </span>
          </div>

          <div className="muted" style={{ fontSize: '0.875rem' }}>
            {formatRelativeTime(notice.createdAt)}
          </div>
        </div>

        <h4 style={{ marginBottom: 8 }}>{notice.title}</h4>
        <p className="muted" style={{ marginBottom: 12 }}>
          {notice.content.substring(0, 200)}{notice.content.length > 200 ? '...' : ''}
        </p>

        {notice.attachments && notice.attachments.length > 0 && (
          <div className="row" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: '0.875rem' }}>📎</span>
            <span className="muted" style={{ fontSize: '0.875rem' }}>
              {notice.attachments.length} attachment{notice.attachments.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        {/* Header */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Notice Board</h3>
            {unreadCount > 0 && (
              <div className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                {unreadCount} Unread
              </div>
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
            <div className="muted">Loading notices...</div>
          </div>
        )}

        {/* Pinned Notices */}
        {!loading && pinnedNotices.length > 0 && (
          <>
            <div className="card" style={{ backgroundColor: 'rgba(255,193,7,0.1)' }}>
              <h4 style={{ marginBottom: 0 }}>📌 Pinned Notices</h4>
            </div>
            {pinnedNotices.map(notice => (
              <NoticeCard key={notice._id} notice={notice} />
            ))}
          </>
        )}

        {/* Regular Notices */}
        {!loading && notices.length > 0 && (
          <>
            <div className="card">
              <h4 style={{ marginBottom: 0 }}>All Notices</h4>
            </div>
            {notices.map(notice => (
              <NoticeCard key={notice._id} notice={notice} />
            ))}
          </>
        )}

        {/* No Notices */}
        {!loading && pinnedNotices.length === 0 && notices.length === 0 && (
          <div className="card">
            <div className="tag" style={{ borderColor: 'rgba(147,197,253,0.4)' }}>
              No notices available
            </div>
          </div>
        )}

        {/* Notice Detail Modal */}
        {selectedNotice && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20
            }}
            onClick={closeNotice}
          >
            <div
              className="card"
              style={{
                maxWidth: 700,
                maxHeight: '90vh',
                overflow: 'auto',
                width: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="row" style={{ gap: 8 }}>
                  {selectedNotice.isUrgent && (
                    <span className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
                      🔥 Urgent
                    </span>
                  )}
                  <span className="tag" style={{ borderColor: 'rgba(147,197,253,0.4)', color: '#bfdbfe' }}>
                    {selectedNotice.category}
                  </span>
                </div>
                <button className="btn secondary" onClick={closeNotice}>
                  ✕ Close
                </button>
              </div>

              {/* Title */}
              <h2 style={{ marginBottom: 12 }}>{selectedNotice.title}</h2>

              {/* Meta */}
              <div className="row" style={{ gap: 16, marginBottom: 20 }}>
                <div className="muted" style={{ fontSize: '0.875rem' }}>
                  Posted by: <strong>{selectedNotice.postedBy?.name || 'Faculty'}</strong>
                </div>
                <div className="muted" style={{ fontSize: '0.875rem' }}>
                  {new Date(selectedNotice.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />

              {/* Content */}
              <div
                style={{
                  padding: '20px 0',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6
                }}
              >
                {selectedNotice.content}
              </div>

              {/* Attachments */}
              {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                <>
                  <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ marginBottom: 12, fontSize: '1rem', fontWeight: 600 }}>
                      📎 Attachments ({selectedNotice.attachments.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedNotice.attachments.map((file, i) => {
                        const isPDF = file.mimeType === 'application/pdf';
                        const isImage = file.mimeType?.startsWith('image/');

                        let fileIcon = isPDF ? '📕' : isImage ? '🖼️' : '📄';
                        let iconColor = isPDF ? '#f87171' : isImage ? '#a78bfa' : '#93c5fd';

                        const fileSizeKB = (file.size / 1024).toFixed(1);
                        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                        const displaySize = file.size > 1024 * 1024
                          ? `${fileSizeMB} MB`
                          : `${fileSizeKB} KB`;

                        return (
                          <div
                            key={i}
                            className="card"
                            style={{
                              backgroundColor: 'rgba(147,197,253,0.05)',
                              border: '1px solid rgba(147,197,253,0.2)',
                              padding: 14,
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(147,197,253,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(147,197,253,0.05)';
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 16,
                              flexWrap: 'wrap'
                            }}>
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  marginBottom: 6
                                }}>
                                  <span style={{
                                    fontSize: '1.5rem',
                                    filter: `drop-shadow(0 0 4px ${iconColor})`
                                  }}>
                                    {fileIcon}
                                  </span>
                                  <div style={{
                                    fontWeight: 500,
                                    fontSize: '0.95rem',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {file.fileName}
                                  </div>
                                </div>
                                <div className="muted" style={{
                                  fontSize: '0.8rem',
                                  paddingLeft: 42
                                }}>
                                  📊 {displaySize}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <a
                                  href={file.googleDriveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn secondary"
                                  style={{
                                    padding: '10px 16px',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {isPDF ? '📄 View PDF' : isImage ? '🖼️ View' : '👁️ View'}
                                </a>

                                <a
                                  href={file.downloadLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn"
                                  style={{
                                    padding: '10px 16px',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  ⬇️ Download
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </MotionFade>
  )
}