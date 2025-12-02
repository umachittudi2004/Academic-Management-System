import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assignmentsApi } from '../api/assignments'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function AssignmentSubmissions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setErr('')
    try {
      const [assignmentRes, submissionsRes, statsRes] = await Promise.all([
        assignmentsApi.getDetails(id),
        assignmentsApi.getSubmissions(id),
        assignmentsApi.getStats(id)
      ])

      setAssignment(assignmentRes.data.assignment)
      setSubmissions(submissionsRes.data.submissions)
      setStats(statsRes.data.stats)
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission)
    setMarks(submission.grade?.marksObtained || '')
    setFeedback(submission.grade?.feedback || '')
    setMsg('')
    setErr('')
  }

  const closeGradeModal = () => {
    setSelectedSubmission(null)
    setMarks('')
    setFeedback('')
    setMsg('')
    setErr('')
  }

  const handleGrade = async (e) => {
    e.preventDefault()
    setGrading(true)
    setMsg('')
    setErr('')

    try {
      await assignmentsApi.gradeSubmission({
        submissionId: selectedSubmission._id,
        marksObtained: parseInt(marks),
        feedback
      })

      setMsg('Graded successfully!')
      
      // Refresh data
      setTimeout(() => {
        fetchData()
        closeGradeModal()
      }, 1500)
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to grade submission')
    } finally {
      setGrading(false)
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

  if (loading) {
    return (
      <MotionFade>
        <div className="card">
          <div className="muted">Loading submissions...</div>
        </div>
      </MotionFade>
    )
  }

  if (err && !assignment) {
    return (
      <MotionFade>
        <div className="card">
          <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
            ✕ {err}
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
          <button 
            className="btn secondary"
            onClick={() => navigate('/faculty/assignments')}
            style={{ marginBottom: 16, padding: '8px 16px', fontSize: '0.875rem' }}
          >
            ← Back to Assignments
          </button>

          <h3 style={{ marginBottom: 8 }}>{assignment?.title}</h3>
          <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="tag">
              {assignment?.subjectId.subjectCode}
            </span>
            <span className="tag">
              Year {assignment?.year} {assignment?.branch} - {assignment?.section}
            </span>
            <span className="tag">
              💯 {assignment?.totalMarks} marks
            </span>
            <span className="tag">
              📅 Due: {formatDate(assignment?.dueDate)}
            </span>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="card">
            <h4 style={{ marginBottom: 16 }}>📊 Statistics</h4>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <div style={{
                padding: 12,
                background: 'rgba(59,130,246,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(59,130,246,0.2)'
              }}>
                <div className="muted" style={{ fontSize: '0.75rem' }}>Submission Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#93c5fd' }}>
                  {stats.submissionRate}%
                </div>
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  {stats.totalSubmissions}/{stats.targetStudents} students
                </div>
              </div>

              <div style={{
                padding: 12,
                background: 'rgba(34,197,94,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(34,197,94,0.2)'
              }}>
                <div className="muted" style={{ fontSize: '0.75rem' }}>Average Marks</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#86efac' }}>
                  {stats.averageMarks || 0}
                </div>
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  High: {stats.highestMarks} | Low: {stats.lowestMarks}
                </div>
              </div>

              <div style={{
                padding: 12,
                background: 'rgba(251,191,36,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(251,191,36,0.2)'
              }}>
                <div className="muted" style={{ fontSize: '0.75rem' }}>On-Time</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fde047' }}>
                  {stats.onTimeSubmissions}
                </div>
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  Late: {stats.lateSubmissions} ({stats.lateRate}%)
                </div>
              </div>

              <div style={{
                padding: 12,
                background: 'rgba(168,85,247,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(168,85,247,0.2)'
              }}>
                <div className="muted" style={{ fontSize: '0.75rem' }}>Grading Progress</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c4b5fd' }}>
                  {stats.gradedSubmissions}/{stats.totalSubmissions}
                </div>
                <div className="muted" style={{ fontSize: '0.75rem' }}>
                  {stats.ungradedSubmissions} pending
                </div>
              </div>
            </div>

            {/* Grade Distribution */}
            {stats.gradeDistribution && stats.gradedSubmissions > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                  Grade Distribution:
                </div>
                <div className="grid grid-2" style={{ gap: 8 }}>
                  {Object.entries(stats.gradeDistribution).map(([range, count]) => (
                    <div 
                      key={range}
                      style={{
                        padding: 8,
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.875rem'
                      }}
                    >
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span>{range}</span>
                        <span className="muted">{count} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submissions List */}
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>
            📋 Submissions ({submissions.length})
          </h4>

          {submissions.length === 0 ? (
            <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
              No submissions yet
            </div>
          ) : (
            <div className="grid" style={{ gap: 12 }}>
              {submissions.map(submission => (
                <div 
                  key={submission._id}
                  className="card"
                  style={{
                    background: submission.isLate 
                      ? 'rgba(239,68,68,0.05)' 
                      : 'rgba(34,197,94,0.05)',
                    borderColor: submission.isLate 
                      ? 'rgba(239,68,68,0.2)' 
                      : 'rgba(34,197,94,0.2)'
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                        {submission.studentId.name}
                      </div>
                      <div className="muted" style={{ fontSize: '0.875rem' }}>
                        {submission.studentId.rollno}
                      </div>
                    </div>

                    <div className="row" style={{ gap: 8 }}>
                      {submission.isLate && (
                        <span 
                          className="tag" 
                          style={{ 
                            fontSize: '0.75rem',
                            borderColor: 'rgba(239,68,68,0.4)',
                            color: '#fca5a5'
                          }}
                        >
                          ⏰ Late
                        </span>
                      )}
                      {submission.grade ? (
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
                      ) : (
                        <span 
                          className="tag" 
                          style={{ 
                            fontSize: '0.75rem',
                            borderColor: 'rgba(251,191,36,0.4)',
                            color: '#fde047'
                          }}
                        >
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                    📅 Submitted: {formatDate(submission.submittedAt)}
                  </div>

                  {/* Files */}
                  <div style={{ marginBottom: 12 }}>
                    <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 6 }}>
                      Files ({submission.submittedFiles.length}):
                    </div>
                    {submission.submittedFiles.map((file, index) => (
                      <a
                        key={index}
                        href={file.googleDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: 6,
                          fontSize: '0.875rem',
                          color: '#93c5fd',
                          textDecoration: 'none',
                          marginBottom: 4
                        }}
                      >
                        📄 {file.fileName}
                      </a>
                    ))}
                  </div>

                  {/* Remarks */}
                  {submission.remarks && (
                    <div style={{
                      padding: 8,
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 6,
                      fontSize: '0.875rem',
                      marginBottom: 12
                    }}>
                      <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                        Student remarks:
                      </div>
                      {submission.remarks}
                    </div>
                  )}

                  {/* Grade Display */}
                  {submission.grade && (
                    <div style={{
                      padding: 12,
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: 8,
                      border: '1px solid rgba(34,197,94,0.2)',
                      marginBottom: 12
                    }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 'bold', color: '#86efac' }}>
                          Marks: {submission.grade.marksObtained}/{submission.grade.totalMarks}
                        </div>
                        <div className="muted" style={{ fontSize: '0.875rem' }}>
                          {submission.grade.percentage.toFixed(1)}%
                        </div>
                      </div>
                      {submission.grade.feedback && (
                        <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                          <div className="muted" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
                            Feedback:
                          </div>
                          {submission.grade.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grade Button */}
                  <button
                    className="btn"
                    onClick={() => openGradeModal(submission)}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {submission.grade ? '✏️ Edit Grade' : '✓ Grade Submission'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grade Modal */}
        {selectedSubmission && (
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
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h4 style={{ marginBottom: 16 }}>
                Grade Submission - {selectedSubmission.studentId.name}
              </h4>

              <form onSubmit={handleGrade}>
                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Marks Obtained (out of {assignment.totalMarks}) *
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={assignment.totalMarks}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                    Feedback
                  </label>
                  <textarea
                    className="input"
                    rows={6}
                    placeholder="Provide detailed feedback..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    maxLength={2000}
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
                    onClick={closeGradeModal}
                    disabled={grading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    disabled={grading}
                  >
                    {grading ? 'Saving...' : '✓ Save Grade'}
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