import { useState, useEffect } from 'react'
import { assignmentsApi } from '../api/assignments'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])  // ← Store File objects
  const [remarks, setRemarks] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    setErr('')
    try {
      const { data } = await assignmentsApi.getStudentAssignments()
      setAssignments(data.assignments || [])
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch assignments')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Just store files locally (upload happens on submit)
    const fileObjects = files.map(file => ({
      fileName: file.name,
      file: file,  // Store actual File object
      mimeType: file.type,
      size: file.size,
      tempId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }))

    setSelectedFiles([...selectedFiles, ...fileObjects])
    setMsg(`${files.length} file(s) selected`)
    setTimeout(() => setMsg(''), 3000)
  }

  const removeFile = (tempId) => {
    setSelectedFiles(selectedFiles.filter(f => f.tempId !== tempId))
  }

  const openSubmitModal = (assignment) => {
    setSelectedAssignment(assignment)
    setSelectedFiles([])  // Start fresh
    setRemarks(assignment.submission?.remarks || '')
    setMsg('')
    setErr('')
  }

  const closeSubmitModal = () => {
    setSelectedAssignment(null)
    setSelectedFiles([])
    setRemarks('')
    setMsg('')
    setErr('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedFiles.length === 0) {
      setErr('Please upload at least one file')
      return
    }

    setSubmitting(true)
    setMsg('')
    setErr('')

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('assignmentId', selectedAssignment._id)
      formData.append('remarks', remarks)

      // Append files with key 'files' (matches backend route)
      selectedFiles.forEach(fileObj => {
        formData.append('files', fileObj.file)
      })

      console.log('📤 Submitting assignment with', selectedFiles.length, 'file(s)...')

      await assignmentsApi.submit(formData)

      setMsg('Submitted successfully!')
      
      setTimeout(() => {
        fetchAssignments()
        closeSubmitModal()
      }, 1500)
    } catch (error) {
      console.error('❌ Submit error:', error)
      setErr(error?.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
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

  const getUrgencyStyle = (urgency) => {
    switch(urgency) {
      case 'overdue':
        return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#fca5a5', label: '⛔ Overdue' }
      case 'urgent':
        return { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fde047', label: '🔥 Due Soon' }
      case 'upcoming':
        return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#93c5fd', label: '⚠️ Upcoming' }
      default:
        return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#86efac', label: '✓ Active' }
    }
  }

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true
    if (filter === 'pending') return a.status === 'pending'
    if (filter === 'submitted') return a.status === 'submitted'
    if (filter === 'graded') return a.status === 'graded'
    return true
  })

  const counts = {
    all: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    graded: assignments.filter(a => a.status === 'graded').length
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        {/* Header */}
        <div className="card">
          <h3>My Assignments</h3>
          <div className="muted">{assignments.length} assignment(s) assigned</div>
        </div>

        {/* Filter Tabs */}
        <div className="card">
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {['all', 'pending', 'submitted', 'graded'].map(f => (
              <button
                key={f}
                className="btn"
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'rgba(108,154,255,0.3)' : 'rgba(147,197,253,0.1)',
                  borderColor: filter === f ? 'rgba(108,154,255,0.6)' : 'rgba(147,197,253,0.3)',
                  color: filter === f ? '#bfdbfe' : 'rgba(255,255,255,0.7)',
                  padding: '8px 16px',
                  fontSize: '0.875rem'
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {err && !selectedAssignment && (
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
        {!loading && filteredAssignments.length > 0 && (
          <div className="grid" style={{ gap: 12 }}>
            {filteredAssignments.map(assignment => {
              const urgencyStyle = getUrgencyStyle(assignment.timeRemaining.urgency)

              return (
                <div 
                  key={assignment._id} 
                  className="card" 
                  style={{
                    background: urgencyStyle.bg,
                    borderColor: urgencyStyle.border
                  }}
                >
                  {/* Header */}
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: 8 }}>{assignment.title}</h4>
                      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ fontSize: '0.75rem' }}>
                          {assignment.subjectId.subjectCode}
                        </span>
                        <span 
                          className="tag" 
                          style={{ 
                            fontSize: '0.75rem',
                            borderColor: urgencyStyle.border,
                            color: urgencyStyle.color
                          }}
                        >
                          {urgencyStyle.label}
                        </span>
                        {assignment.status === 'graded' && (
                          <span 
                            className="tag" 
                            style={{ 
                              fontSize: '0.75rem',
                              borderColor: 'rgba(34,197,94,0.4)',
                              color: '#86efac'
                            }}
                          >
                            ✓ Graded
                          </span>
                        )}
                      </div>
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
                    {assignment.description.length > 150 
                      ? assignment.description.substring(0, 150) + '...'
                      : assignment.description
                    }
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>Due Date</div>
                      <div>{formatDate(assignment.dueDate)}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>Total Marks</div>
                      <div>💯 {assignment.totalMarks}</div>
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>Time Remaining</div>
                      <div>
                        {assignment.timeRemaining.urgency === 'overdue' 
                          ? 'Overdue'
                          : `${assignment.timeRemaining.days}d ${assignment.timeRemaining.hours}h`
                        }
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div className="muted" style={{ fontSize: '0.75rem' }}>Faculty</div>
                      <div>{assignment.facultyId.name}</div>
                    </div>
                  </div>

                  {/* Attachments */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 6 }}>
                        📎 Problem Statements:
                      </div>
                      {assignment.attachments.map((file, index) => (
                        <a
                          key={index}
                          href={file.googleDriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            padding: 4,
                            fontSize: '0.875rem',
                            color: '#93c5fd',
                            textDecoration: 'none'
                          }}
                        >
                          📄 {file.fileName}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Grade Display */}
                  {assignment.grade && (
                    <div style={{
                      padding: 12,
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: 8,
                      border: '1px solid rgba(34,197,94,0.2)',
                      marginBottom: 12
                    }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#86efac' }}>
                          Score: {assignment.grade.marksObtained}/{assignment.grade.totalMarks}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#86efac' }}>
                          {assignment.grade.percentage.toFixed(1)}%
                        </div>
                      </div>
                      {assignment.grade.feedback && (
                        <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                          <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                            Feedback:
                          </div>
                          {assignment.grade.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission Info */}
                  {assignment.submission && !assignment.grade && (
                    <div style={{
                      padding: 12,
                      background: 'rgba(59,130,246,0.1)',
                      borderRadius: 8,
                      border: '1px solid rgba(59,130,246,0.2)',
                      marginBottom: 12,
                      fontSize: '0.875rem'
                    }}>
                      <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                        ✓ Submitted on {formatDate(assignment.submission.submittedAt)}
                      </div>
                      {assignment.submission.isLate && (
                        <div style={{ color: '#fca5a5', fontSize: '0.75rem' }}>
                          ⏰ Late submission
                        </div>
                      )}
                      <div className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                        Awaiting grading...
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    className="btn"
                    onClick={() => openSubmitModal(assignment)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: assignment.submission 
                        ? 'rgba(59,130,246,0.2)'
                        : assignment.timeRemaining.urgency === 'urgent'
                        ? 'rgba(251,191,36,0.2)'
                        : 'rgba(34,197,94,0.2)',
                      borderColor: assignment.submission 
                        ? 'rgba(59,130,246,0.4)'
                        : assignment.timeRemaining.urgency === 'urgent'
                        ? 'rgba(251,191,36,0.4)'
                        : 'rgba(34,197,94,0.4)',
                      color: assignment.submission 
                        ? '#93c5fd'
                        : assignment.timeRemaining.urgency === 'urgent'
                        ? '#fde047'
                        : '#86efac'
                    }}
                  >
                    {assignment.submission 
                      ? '📝 View/Resubmit' 
                      : assignment.timeRemaining.urgency === 'urgent'
                      ? '🔥 Submit Now (Due Soon!)'
                      : '📤 Submit Assignment'
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAssignments.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div className="muted">
              {filter === 'all' 
                ? 'No assignments assigned yet'
                : `No ${filter} assignments`
              }
            </div>
          </div>
        )}

        {/* Submit Modal */}
        {selectedAssignment && (
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
              <h4 style={{ marginBottom: 16 }}>
                Submit Assignment - {selectedAssignment.title}
              </h4>

              <form onSubmit={handleSubmit}>
                {/* Assignment Info */}
                <div style={{
                  padding: 12,
                  background: 'rgba(59,130,246,0.1)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.875rem'
                }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Due: {formatDate(selectedAssignment.dueDate)}</span>
                    <span>Marks: {selectedAssignment.totalMarks}</span>
                  </div>
                  {selectedAssignment.timeRemaining.urgency === 'urgent' && (
                    <div style={{ color: '#fde047', marginTop: 8 }}>
                      🔥 Due in {selectedAssignment.timeRemaining.hours} hours!
                    </div>
                  )}
                </div>

                {/* File Upload */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Upload Files (Your Solution) *
                  </label>
                  <input 
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="submit-file-upload"
                    accept=".pdf,.doc,.docx,.txt,.cpp,.java,.py,.zip,.rar"
                  />
                  <label 
                    htmlFor="submit-file-upload"
                    className="btn"
                    style={{ 
                      display: 'inline-block',
                      cursor: 'pointer'
                    }}
                  >
                    📎 Choose Files
                  </label>

                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div className="muted" style={{ marginBottom: 8, fontSize: '0.875rem' }}>
                        Selected files ({selectedFiles.length}):
                      </div>
                      <div className="grid" style={{ gap: 8 }}>
                        {selectedFiles.map((file) => (
                          <div 
                            key={file.tempId}
                            className="row"
                            style={{
                              padding: 8,
                              background: 'rgba(34,197,94,0.1)',
                              borderRadius: 6,
                              border: '1px solid rgba(34,197,94,0.2)',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.875rem'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                📄 {file.fileName}
                              </div>
                              <div className="muted" style={{ fontSize: '0.75rem' }}>
                                {(file.size / 1024).toFixed(1)} KB
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn danger"
                              onClick={() => removeFile(file.tempId)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Remarks */}
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Remarks (Optional)
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Add any notes or comments about your submission..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    maxLength={1000}
                  />
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
                    onClick={closeSubmitModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    disabled={submitting || selectedFiles.length === 0}
                  >
                    {submitting 
                      ? '📤 Submitting...' 
                      : selectedAssignment.submission 
                      ? '✓ Resubmit' 
                      : '✓ Submit'
                    }
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