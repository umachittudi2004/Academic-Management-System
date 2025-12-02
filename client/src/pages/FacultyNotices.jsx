import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { noticesApi } from '../api/notices'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function FacultyNotices() {
    const [notices, setNotices] = useState([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState('')
    const [msg, setMsg] = useState('')

    const load = async () => {
        setLoading(true)
        setErr('')
        try {
            const { data } = await noticesApi.getFacultyNotices()
            setNotices(data.notices || [])
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to fetch notices')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return

        try {
            const { data } = await noticesApi.delete(id)
            setMsg(data.message || 'Notice deleted')
            await load()
            setTimeout(() => setMsg(''), 3000)
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to delete notice')
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <MotionFade>
            <div className="grid" style={{ gap: 12 }}>
                {/* Header */}
                <div className="card">
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>My Notices</h3>
                        <Link to="/faculty/notices/create" className="btn">
                            + Create Notice
                        </Link>
                    </div>
                </div>

                {/* Messages */}
                {msg && (
                    <div className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                        ✓ {msg}
                    </div>
                )}
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

                {/* Notices List */}
                {!loading && notices.length === 0 && (
                    <div className="card">
                        <div className="tag" style={{ borderColor: 'rgba(147,197,253,0.4)' }}>
                            No notices yet. Create your first notice!
                        </div>
                    </div>
                )}

                {notices.map(notice => (
                    <div key={notice._id} className="card">
                        {/* Badges */}
                        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                            <div className="row" style={{ gap: 8 }}>
                                {notice.isPinned && (
                                    <span className="tag" style={{ borderColor: 'rgba(255,193,7,0.5)', color: '#ffd54f' }}>
                                        📌 Pinned
                                    </span>
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
                                {formatDate(notice.createdAt)}
                            </div>
                        </div>

                        {/* Title */}
                        <h4 style={{ marginBottom: 8 }}>{notice.title}</h4>

                        {/* Content Preview */}
                        <p className="muted" style={{ marginBottom: 12 }}>
                            {notice.content.substring(0, 150)}{notice.content.length > 150 ? '...' : ''}
                        </p>

                        {/* Target Info */}
                        <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                            <span className="muted" style={{ fontSize: '0.875rem' }}>Target:</span>
                            {notice.targetYear.length > 0 ? (
                                notice.targetYear.map(y => (
                                    <span key={y} className="tag" style={{ fontSize: '0.75rem' }}>
                                        Y{y}
                                    </span>
                                ))
                            ) : (
                                <span className="tag" style={{ fontSize: '0.75rem' }}>All Years</span>
                            )}

                            {notice.targetBranch.length > 0 ? (
                                notice.targetBranch.map(b => (
                                    <span key={b} className="tag" style={{ fontSize: '0.75rem' }}>
                                        {b}
                                    </span>
                                ))
                            ) : (
                                <span className="tag" style={{ fontSize: '0.75rem' }}>All Branches</span>
                            )}

                            {notice.targetSection.length > 0 && (
                                notice.targetSection.map(s => (
                                    <span key={s} className="tag" style={{ fontSize: '0.75rem' }}>
                                        Sec {s}
                                    </span>
                                ))
                            )}
                        </div>

                        {/* Stats */}
                        {/* Stats - Replace the existing stats div with this */}
                        <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                <span>
                                    👁️ <strong>{notice.viewCount}</strong> total views
                                </span>
                                <span>
                                    👤 <strong>{notice.uniqueReaderCount || 0}</strong> unique readers
                                </span>
                                <span>
                                    ✓ <strong>{notice.readCount || 0}</strong> marked as read
                                </span>
                                {notice.attachments && notice.attachments.length > 0 && (
                                    <span>
                                        📎 <strong>{notice.attachments.length}</strong> attachment{notice.attachments.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                            <button
                                className="btn danger"
                                onClick={() => handleDelete(notice._id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </MotionFade>
    )
}