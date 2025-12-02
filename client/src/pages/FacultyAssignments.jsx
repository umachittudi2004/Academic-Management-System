import { useState, useEffect } from 'react'
import { assignmentsApi } from '../api/assignments'
import { useNavigate } from 'react-router-dom'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function FacultyAssignments() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    setErr('')
    try {
      const { data } = await assignmentsApi.getFacultyAssignments()
      setAssignments(data.assignments || [])
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch assignments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return

    try {
      await assignmentsApi.delete(id)
      setAssignments(assignments.filter(a => a._id !== id))
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to delete assignment')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUrgency = (dueDate) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = due - now
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (diff < 0) return { label: 'Overdue', color: 'rgba(239,68,68,0.4)', textColor: '#fca5a5' }
    if (hours < 24) return { label: 'Due Soon', color: 'rgba(251,191,36,0.4)', textColor: '#fde047' }
    if (hours < 72) return { label: 'Upcoming', color: 'rgba(59,130,246,0.4)', textColor: '#93c5fd' }
    return { label: 'Active', color: 'rgba(34,197,94,0.4)', textColor: '#86efac' }
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        {/* Header */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h3>My Assignments</h3>
              <div className="muted">{assignments.length} assignment(s) created</div>
            </div>
            <button 
              className="btn"
              onClick={() => navigate('/faculty/assignments/create')}
            >
              + Create New
            </button>
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
            <div className="muted">Loading assignments...</div>
          </div>
        )}

        {/* Assignment Cards */}
        {!loading && assignments.length > 0 && (
          <div className="grid" style={{ gap: 12 }}>
            {assignments.map(assignment => {
              const urgency = getUrgency(assignment.dueDate)
              const submissionRate = parseFloat(assignment.stats.submissionRate)

              return (
                <div key={assignment._id} className="card" style={{
                  background: 'rgba(147,197,253,0.05)',
                  borderColor: 'rgba(147,197,253,0.2)'
                }}>
                  {/* Header */}
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: 8, color: '#bfdbfe' }}>
                        {assignment.title}
                      </h4>
                      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ fontSize: '0.75rem' }}>
                          {assignment.subjectId.subjectCode}
                        </span>
                        <span className="tag" style={{ fontSize: '0.75rem' }}>
                          Year {assignment.year} {assignment.branch} - {assignment.section}
                        </span>
                        <span 
                          className="tag" 
                          style={{ 
                            fontSize: '0.75rem',
                            borderColor: urgency.color,
                            color: urgency.textColor
                          }}
                        >
                          {urgency.label}
                        </span>
                      </div>
                    </div>

                    <div className="row" style={{ gap: 8 }}>
                      <button
                        className="btn secondary"
                        onClick={() => navigate(`/faculty/assignments/${assignment._id}/submissions`)}
                        style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                      >
                        📋 Submissions
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => handleDelete(assignment._id)}
                        style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    padding: 12,
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 8,
                    marginBottom: 12,
                    fontSize: '0.875rem',
                    lineHeight: 1.6
                  }}>
                    {assignment.description.length > 200 
                      ? assignment.description.substring(0, 200) + '...'
                      : assignment.description
                    }
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div style={{
                      padding: 12,
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: 8,
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                        Submissions
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#93c5fd' }}>
                        {assignment.stats.totalSubmissions}/{assignment.stats.targetStudents}
                      </div>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>
                        {assignment.stats.submissionRate}% rate
                      </div>
                    </div>

                    <div style={{
                      padding: 12,
                      background: submissionRate >= 50 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      borderRadius: 8,
                      border: `1px solid ${submissionRate >= 50 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                    }}>
                      <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                        Grading
                      </div>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        color: submissionRate >= 50 ? '#86efac' : '#fca5a5'
                      }}>
                        {assignment.stats.gradedSubmissions}/{assignment.stats.totalSubmissions}
                      </div>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>
                        {assignment.stats.pendingGrading} pending
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="muted" style={{ fontSize: '0.75rem' }}>
                      📅 Due: {formatDate(assignment.dueDate)}
                    </div>
                    <div className="muted" style={{ fontSize: '0.75rem' }}>
                      💯 Total: {assignment.totalMarks} marks
                    </div>
                  </div>

                  {/* Attachments */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 6 }}>
                        📎 {assignment.attachments.length} attachment(s)
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && assignments.length === 0 && (
          <div className="card" style={{
            background: 'rgba(147,197,253,0.05)',
            borderColor: 'rgba(147,197,253,0.2)',
            textAlign: 'center',
            padding: 40
          }}>
            <h4 style={{ marginBottom: 12, color: '#bfdbfe' }}>📚 No Assignments Yet</h4>
            <p className="muted" style={{ marginBottom: 20 }}>
              Create your first assignment to get started
            </p>
            <button 
              className="btn"
              onClick={() => navigate('/faculty/assignments/create')}
            >
              + Create Assignment
            </button>
          </div>
        )}
      </div>
    </MotionFade>
  )
}