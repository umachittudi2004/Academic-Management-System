import { useState, useEffect } from 'react'
import { assignmentsApi } from '../api/assignments'
import { subjectsApi } from '../api/subjects'
import MotionFade from '../components/motion/MotionFade.jsx'
import { useNavigate } from 'react-router-dom'

export default function CreateAssignment() {
    const navigate = useNavigate()
    const [subjects, setSubjects] = useState([])
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [subjectId, setSubjectId] = useState('')
    const [year, setYear] = useState('')
    const [branch, setBranch] = useState('')
    const [section, setSection] = useState('')
    const [totalMarks, setTotalMarks] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [dueTime, setDueTime] = useState('23:59')
    const [attachments, setAttachments] = useState([])
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

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        // Store files with unique IDs for removal
        const fileObjects = files.map(file => ({
            fileName: file.name,
            file: file,
            mimeType: file.type,
            size: file.size,
            tempId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))

        setAttachments([...attachments, ...fileObjects])
        setMsg(`${files.length} file(s) selected`)
        setTimeout(() => setMsg(''), 3000)
    }

    const removeAttachment = (tempId) => {
        setAttachments(attachments.filter(att => att.tempId !== tempId))
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setMsg('')
        setErr('')
        setLoading(true)

        try {
            // Combine date and time
            const dueDateTimeString = `${dueDate}T${dueTime}:00`
            const dueDateUTC = new Date(dueDateTimeString).toISOString()

            // Create FormData
            const formData = new FormData()
            formData.append('title', title)
            formData.append('description', description)
            formData.append('subjectId', subjectId)
            formData.append('year', year)
            formData.append('branch', branch)
            formData.append('section', section)
            formData.append('totalMarks', totalMarks)
            formData.append('dueDate', dueDateUTC)

            // Append files
            attachments.forEach(attachment => {
                if (attachment.file) {
                    formData.append('attachments', attachment.file)
                }
            })

            console.log('📤 Submitting assignment with', attachments.length, 'file(s)...')

            const { data } = await assignmentsApi.create(formData)

            setMsg(data.message || 'Assignment created successfully')

            setTimeout(() => {
                navigate('/faculty/assignments')
            }, 2000)
        } catch (error) {
            console.error('❌ Submit error:', error)
            setErr(error?.response?.data?.message || 'Failed to create assignment')
        } finally {
            setLoading(false)
        }
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <MotionFade>
            <form className="card grid grid-2" onSubmit={onSubmit} style={{ gap: 16 }}>
                <h3 style={{ gridColumn: '1/-1' }}>Create New Assignment</h3>

                {/* Subject */}
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
                                {subject.subjectCode} - {subject.subjectName} (Year {subject.year}, {subject.branch}, Sec {subject.section})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Title */}
                <div style={{ gridColumn: '1/-1' }}>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Title *</label>
                    <input
                        className="input"
                        type="text"
                        placeholder="e.g., Assignment 1 - Binary Search Tree"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        minLength={5}
                        maxLength={200}
                    />
                </div>

                {/* Description */}
                <div style={{ gridColumn: '1/-1' }}>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Description *</label>
                    <textarea
                        className="input"
                        placeholder="Describe the assignment requirements, deliverables, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        minLength={10}
                        maxLength={5000}
                        rows={6}
                    />
                </div>

                {/* Total Marks */}
                <div>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Total Marks *</label>
                    <input
                        className="input"
                        type="number"
                        placeholder="100"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(e.target.value)}
                        required
                        min={1}
                        max={100}
                    />
                </div>

                {/* Due Date */}
                <div>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Due Date *</label>
                    <input
                        className="input"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                        min={today}
                    />
                </div>

                {/* Due Time */}
                <div>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Due Time *</label>
                    <input
                        className="input"
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        required
                    />
                </div>

                {/* Year */}
                <div>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Year *</label>
                    <input
                        className="input"
                        type="number"
                        value={year}
                        readOnly
                        required
                    />
                </div>

                {/* Branch */}
                <div>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Branch *</label>
                    <input
                        className="input"
                        value={branch}
                        readOnly
                        required
                    />
                </div>

                {/* Section */}
                <div>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>Section *</label>
                    <input
                        className="input"
                        value={section}
                        readOnly
                        required
                    />
                </div>

                {/* File Upload */}
                <div style={{ gridColumn: '1/-1' }}>
                    <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
                        Attachments (Problem statements, sample files, etc.)
                    </label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.txt,.cpp,.java,.py,.zip,.rar"
                    />
                    <label
                        htmlFor="file-upload"
                        className="btn"
                        style={{
                            display: 'inline-block',
                            cursor: 'pointer'
                        }}
                    >
                        📎 Choose Files
                    </label>

                    {attachments.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <div className="muted" style={{ marginBottom: 8 }}>
                                Selected files ({attachments.length}) - will upload when you publish:
                            </div>
                            <div className="grid" style={{ gap: 8 }}>
                                {attachments.map((file) => (
                                    <div
                                        key={file.tempId}
                                        className="row"
                                        style={{
                                            padding: 8,
                                            background: 'rgba(147,197,253,0.1)',
                                            borderRadius: 6,
                                            border: '1px solid rgba(147,197,253,0.2)',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                                📄 {file.fileName}
                                            </div>
                                            <div className="muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                                                {(file.size / 1024).toFixed(1)} KB • {file.mimeType}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn danger"
                                            onClick={() => removeAttachment(file.tempId)}
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

                {/* Buttons */}
                <div className="row" style={{ gridColumn: '1/-1', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                        type="button"
                        className="btn secondary"
                        onClick={() => navigate('/faculty/assignments')}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? '📤 Publishing...' : '✓ Publish Assignment'}
                    </button>
                </div>

                {/* Messages */}
                {msg && (
                    <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
                        ✓ {msg}
                    </div>
                )}
                {err && (
                    <div className="tag" style={{ gridColumn: '1/-1', borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0', whiteSpace: 'pre-wrap' }}>
                        ✕ {err}
                    </div>
                )}
            </form>
        </MotionFade>
    )
}