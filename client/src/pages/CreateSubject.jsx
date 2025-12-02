import { useState } from 'react'
import { subjectsApi } from '../api/subjects'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function CreateSubject() {
  const [subjectName, setSubjectName] = useState('')
  const [subjectCode, setSubjectCode] = useState('')
  const [year, setYear] = useState('')
  const [branch, setBranch] = useState('')
  const [section, setSection] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    setLoading(true)
    try {
      const { data } = await subjectsApi.create({ subjectName, subjectCode, year, branch, section })
      setMsg(data.message || 'Created')
      setSubjectName('')
      setSubjectCode('')
      setYear('')
      setBranch('')
      setSection('')
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to create subject')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionFade>
      <form className="card grid grid-2" onSubmit={onSubmit}>
        <h3 style={{ gridColumn: '1/-1' }}>Create Subject</h3>
        <input className="input" placeholder="Subject Name" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
        <input className="input" placeholder="Subject Code" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
        <input className="input" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        <input className="input" placeholder="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
        <input className="input" placeholder="Section" value={section} onChange={(e) => setSection(e.target.value)} />
        <div className="row" style={{ gridColumn: '1/-1', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
        </div>
        {msg && <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>{msg}</div>}
        {err && <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>{err}</div>}
        <div className="muted" style={{ gridColumn: '1/-1' }}>
          Note: Backend uses studentAuthCheck for this route and associates subject with req.studentId as faculty.
        </div>
      </form>
    </MotionFade>
  )
}