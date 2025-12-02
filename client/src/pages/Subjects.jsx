import { useEffect, useState } from 'react'
import { subjectsApi } from '../api/subjects'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState([])
  const [lookup, setLookup] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await subjectsApi.getAll()
        setSubjects(data.subjects || [])
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch subjects')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const doLookup = async () => {
    setError('')
    try {
      const { data } = await subjectsApi.getByIds(selected)
      setLookup(data.subject || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Lookup failed')
    }
  }

  return (
    <MotionFade>
      <div className="grid" style={{ gap: 12 }}>
        <div className="card">
          <h3>All Subjects</h3>
          {loading && <div className="muted">Loading...</div>}
          {error && <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)' }}>{error}</div>}
          <div className="list">
            {subjects.map(s => (
              <label key={s._id} className="card row" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <strong>{s.subjectName}</strong> <span className="muted">({s.subjectCode})</span>
                  <div className="muted">Y{s.year} {s.branch}-{s.section}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selected.includes(s._id)}
                  onChange={() => toggle(s._id)}
                />
              </label>
            ))}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={doLookup}>Lookup selected by IDs</button>
          </div>
        </div>

        <div className="card">
          <h3>Lookup Results</h3>
          <div className="list">
            {lookup.map(s => (
              <div key={s._id} className="card">
                <strong>{s.subjectName}</strong> <span className="muted">({s.subjectCode})</span>
              </div>
            ))}
            {lookup.length === 0 && <div className="muted">No lookup results.</div>}
          </div>
        </div>
      </div>
    </MotionFade>
  )
}