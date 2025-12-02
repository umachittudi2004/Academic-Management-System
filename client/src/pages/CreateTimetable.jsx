import { useState, useEffect } from 'react'
import { timetableApi } from '../api/timetable'
import { subjectsApi } from '../api/subjects'
import MotionFade from '../components/motion/MotionFade.jsx'

export default function CreateTimetable() {
  const [subjects, setSubjects] = useState([])
  const [day, setDay] = useState('Monday')
  const [periodNumber, setPeriodNumber] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [year, setYear] = useState('')
  const [branch, setBranch] = useState('')
  const [section, setSection] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await subjectsApi.getByFaculty()
        setSubjects(data.subjects || [])
      } catch (error) {
        console.error('Failed to fetch subjects')
      }
    }
    fetchSubjects()
  }, [])

  const handleSubjectChange = (selectedId) => {
    setSubjectId(selectedId)
    const selected = subjects.find(s => s._id === selectedId)
    if (selected) {
      setYear(selected.year)
      setBranch(selected.branch)
      setSection(selected.section)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    setLoading(true)
    
    try {
      const { data } = await timetableApi.create({
        day,
        periodNumber: parseInt(periodNumber),
        startTime,
        endTime,
        subjectId,
        year,
        branch,
        section,
        roomNumber
      })
      
      setMsg(data.message || 'Timetable entry created')
      
      setPeriodNumber('')
      setStartTime('')
      setEndTime('')
      setSubjectId('')
      setYear('')
      setBranch('')
      setSection('')
      setRoomNumber('')
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to create entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionFade>
      <form className="card grid grid-2" onSubmit={onSubmit} style={{ gap: 16 }}>
        <h3 style={{ gridColumn: '1/-1' }}>Create Timetable Entry</h3>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Day *</label>
          <select className="input" value={day} onChange={(e) => setDay(e.target.value)} required>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
          </select>
        </div>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Period Number *</label>
          <input 
            className="input" 
            type="number" 
            min="1" 
            max="8" 
            placeholder="e.g. 1, 2, 3..." 
            value={periodNumber} 
            onChange={(e) => setPeriodNumber(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Start Time *</label>
          <input 
            className="input" 
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>End Time *</label>
          <input 
            className="input" 
            type="time" 
            value={endTime} 
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <div style={{ gridColumn: '1/-1' }}>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Subject *</label>
          <select 
            className="input" 
            value={subjectId} 
            onChange={(e) => handleSubjectChange(e.target.value)}
            required
          >
            <option value="">-- Select Subject --</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.subjectCode} - {subject.subjectName} ({subject.year} Year, {subject.branch}, Sec {subject.section})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Year *</label>
          <input className="input" type="number" value={year} onChange={(e) => setYear(e.target.value)} required readOnly />
        </div>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Branch *</label>
          <input className="input" value={branch} onChange={(e) => setBranch(e.target.value)} required readOnly />
        </div>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Section *</label>
          <input className="input" value={section} onChange={(e) => setSection(e.target.value)} required readOnly />
        </div>

        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Room Number</label>
          <input className="input" placeholder="e.g. A-101" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
        </div>

        <div className="row" style={{ gridColumn: '1/-1', justifyContent: 'flex-end' }}>
          <button className="btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Entry'}
          </button>
        </div>

        {msg && <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>{msg}</div>}
        {err && <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>{err}</div>}
      </form>
    </MotionFade>
  )
}