import { useEffect, useState } from 'react'
import { useAuth } from '../state/AuthContext.jsx'
import { subjectsApi } from '../api/subjects'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await subjectsApi.getsubjectbyyearbranchsection()
        setSubjects(data.subjects || [])
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch subjects')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        <div className="card">
          <h2>Hello, {user?.name || user?.rollno || 'Student'}</h2>
          <div className="muted">Year: {user?.year} | Branch: {user?.branch} | Section: {user?.section}</div>
        </div>

        <div className="card">
          <h3>Your Subjects</h3>
          {loading && <div className="muted">Loading...</div>}
          {error && <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)' }}>{error}</div>}
          <div className="list">
            {subjects.map(s => (
              <div key={s._id} className="card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>{s.subjectName}</strong> <span className="muted">({s.subjectCode})</span>
                    <div className="muted">Y{ s.year } { s.branch } - { s.section }</div>
                  </div>
                  {s.faculty && (
                    <div className="tag">Faculty: {s.faculty?.name} ({s.faculty?.empId})</div>
                  )}
                </div>
              </div>
            ))}
            {(!loading && subjects.length === 0) && <div className="muted">No subjects found.</div>}
          </div>
        </div>
      </div>
    </MotionFade>
  )
}