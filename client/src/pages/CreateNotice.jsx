import { useState } from 'react'
import { noticesApi } from '../api/notices'
import MotionFade from '../components/motion/MotionFade.jsx'
import { useNavigate } from 'react-router-dom'

export default function CreateNotice() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [targetYear, setTargetYear] = useState([])
  const [targetBranch, setTargetBranch] = useState([])
  const [targetSection, setTargetSection] = useState([])
  const [isUrgent, setIsUrgent] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 3) {
      setErr('Maximum 3 files allowed')
      return
    }
    setFiles(selectedFiles)
    setErr('')
  }

  const toggleArray = (arr, setArr, value) => {
    if (arr.includes(value)) {
      setArr(arr.filter(v => v !== value))
    } else {
      setArr([...arr, value])
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setErr('')

    if (!title || !content) {
      setErr('Title and content are required')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      formData.append('category', category)
      formData.append('targetYear', JSON.stringify(targetYear))
      formData.append('targetBranch', JSON.stringify(targetBranch))
      formData.append('targetSection', JSON.stringify(targetSection))
      formData.append('isUrgent', isUrgent)
      formData.append('isPinned', isPinned)

      files.forEach(file => {
        formData.append('attachments', file)
      })

      const { data } = await noticesApi.create(formData)
      setMsg(data.message || 'Notice created successfully')
      
      // Reset form
      setTimeout(() => {
        navigate('/faculty/notices')
      }, 1500)
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to create notice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MotionFade>
      <form className="card grid grid-2" onSubmit={onSubmit} style={{ gap: 16 }}>
        <h3 style={{ gridColumn: '1/-1' }}>Create Notice</h3>

        {/* Title */}
        <input
          className="input"
          placeholder="Notice Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ gridColumn: '1/-1' }}
          required
        />

        {/* Category */}
        <div>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="event">Event</option>
            <option value="exam">Exam</option>
            <option value="placement">Placement</option>
          </select>
        </div>

        {/* Flags */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
            <span>Mark as Urgent</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
            <span>Pin to Top</span>
          </label>
        </div>

        {/* Content */}
        <div style={{ gridColumn: '1/-1' }}>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Content</label>
          <textarea
            className="input"
            placeholder="Enter notice content..."
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {/* Target Year */}
        <div style={{ gridColumn: '1/-1' }}>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
            Target Year (leave empty for all years)
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(y => (
              <label
                key={y}
                className="tag"
                style={{
                  cursor: 'pointer',
                  borderColor: targetYear.includes(y) ? 'rgba(34,197,94,0.6)' : 'rgba(147,197,253,0.4)',
                  color: targetYear.includes(y) ? '#c6ffda' : '#bfdbfe'
                }}
              >
                <input
                  type="checkbox"
                  checked={targetYear.includes(y)}
                  onChange={() => toggleArray(targetYear, setTargetYear, y)}
                  style={{ marginRight: 6 }}
                />
                Year {y}
              </label>
            ))}
          </div>
        </div>

        {/* Target Branch */}
        <div style={{ gridColumn: '1/-1' }}>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
            Target Branch (leave empty for all branches)
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(b => (
              <label
                key={b}
                className="tag"
                style={{
                  cursor: 'pointer',
                  borderColor: targetBranch.includes(b) ? 'rgba(34,197,94,0.6)' : 'rgba(147,197,253,0.4)',
                  color: targetBranch.includes(b) ? '#c6ffda' : '#bfdbfe'
                }}
              >
                <input
                  type="checkbox"
                  checked={targetBranch.includes(b)}
                  onChange={() => toggleArray(targetBranch, setTargetBranch, b)}
                  style={{ marginRight: 6 }}
                />
                {b}
              </label>
            ))}
          </div>
        </div>

        {/* Target Section */}
        <div style={{ gridColumn: '1/-1' }}>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
            Target Section (leave empty for all sections)
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['A', 'B', 'C'].map(s => (
              <label
                key={s}
                className="tag"
                style={{
                  cursor: 'pointer',
                  borderColor: targetSection.includes(s) ? 'rgba(34,197,94,0.6)' : 'rgba(147,197,253,0.4)',
                  color: targetSection.includes(s) ? '#c6ffda' : '#bfdbfe'
                }}
              >
                <input
                  type="checkbox"
                  checked={targetSection.includes(s)}
                  onChange={() => toggleArray(targetSection, setTargetSection, s)}
                  style={{ marginRight: 6 }}
                />
                Section {s}
              </label>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div style={{ gridColumn: '1/-1' }}>
          <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
            Attachments (optional, max 3 files, 5MB each)
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            style={{ marginTop: 8 }}
          />
          {files.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map((f, i) => (
                <div key={i} className="tag" style={{ borderColor: 'rgba(147,197,253,0.4)' }}>
                  📎 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="row" style={{ gridColumn: '1/-1', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate('/faculty/notices')}
          >
            Cancel
          </button>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Notice'}
          </button>
        </div>

        {/* Messages */}
        {msg && (
          <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
            ✓ {msg}
          </div>
        )}
        {err && (
          <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
            ✕ {err}
          </div>
        )}
      </form>
    </MotionFade>
  )
}