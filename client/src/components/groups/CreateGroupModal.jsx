import { useState, useEffect } from 'react'
import { groupsApi } from '../../api/groups'
import { studentsApi } from '../../api/students'

export default function CreateGroupModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  // Step 1: Group Info
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')

  // Step 2: Filters
  const [selectedFilters, setSelectedFilters] = useState([])
  const [currentYear, setCurrentYear] = useState('')
  const [currentBranch, setCurrentBranch] = useState('CSE-DS')
  const [currentSection, setCurrentSection] = useState('')

  // Step 3: Student Selection
  const [allStudents, setAllStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Step 4: Settings
  const [settings, setSettings] = useState({
    allowStudentMessages: true,
    allowFileSharing: true,
    allowMentions: true,
    allowFreeLeave: false,
    requireMessageApproval: false
  })

  // Reset when modal opens
  useEffect(() => {
    return () => {
      setStep(1)
      setGroupName('')
      setGroupDescription('')
      setSelectedStudents([])
      setAllStudents([])
    }
  }, [])

  // ========== STEP 2: ADD FILTER ==========
  const handleAddFilter = async () => {
    if (!currentYear || !currentSection) {
      setErr('Please select Year and Section')
      return
    }

    setLoadingStudents(true)
    setErr('')

    try {
      const { data } = await studentsApi.getByFilter(
        currentYear,
        currentBranch,
        currentSection
      )

      const students = data.students || []

      // Add to all students (avoid duplicates)
      const newStudents = students.filter(s => 
        !allStudents.some(existing => existing._id === s._id)
      )

      setAllStudents([...allStudents, ...newStudents])

      // Add filter to list
      const filterLabel = `Year ${currentYear} ${currentBranch} Section ${currentSection}`
      if (!selectedFilters.some(f => f.label === filterLabel)) {
        setSelectedFilters([...selectedFilters, {
          label: filterLabel,
          year: currentYear,
          branch: currentBranch,
          section: currentSection,
          count: students.length
        }])
      }

      setMsg(`Added ${students.length} students`)
      setTimeout(() => setMsg(''), 3000)

      // Reset current selections
      setCurrentYear('')
      setCurrentSection('')
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to fetch students')
    } finally {
      setLoadingStudents(false)
    }
  }

  // ========== QUICK SELECT OPTIONS ==========
  const handleQuickSelect = async (year, section) => {
    setCurrentYear(year)
    setCurrentSection(section)
    // Auto-trigger add filter
    setTimeout(() => {
      handleAddFilter()
    }, 100)
  }

  const removeFilter = (index) => {
    const filter = selectedFilters[index]
    
    // Remove students from this filter
    const studentsToRemove = allStudents.filter(s => 
      s.year === parseInt(filter.year) &&
      s.branch === filter.branch &&
      s.section === filter.section
    )

    const studentIdsToRemove = studentsToRemove.map(s => s._id)

    setAllStudents(allStudents.filter(s => !studentIdsToRemove.includes(s._id)))
    setSelectedStudents(selectedStudents.filter(id => !studentIdsToRemove.includes(id)))
    setSelectedFilters(selectedFilters.filter((_, i) => i !== index))
  }

  // ========== STEP 3: STUDENT SELECTION ==========
  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  const selectAll = () => {
    const filteredIds = getFilteredStudents().map(s => s._id)
    setSelectedStudents([...new Set([...selectedStudents, ...filteredIds])])
  }

  const deselectAll = () => {
    const filteredIds = getFilteredStudents().map(s => s._id)
    setSelectedStudents(selectedStudents.filter(id => !filteredIds.includes(id)))
  }

  const getFilteredStudents = () => {
    if (!searchTerm) return allStudents

    return allStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollno.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // ========== NAVIGATION ==========
  const goToStep = (stepNumber) => {
    setErr('')
    setMsg('')

    // Validation before moving forward
    if (stepNumber > step) {
      if (step === 1) {
        if (!groupName.trim()) {
          setErr('Group name is required')
          return
        }
        if (groupName.length < 3) {
          setErr('Group name must be at least 3 characters')
          return
        }
      }

      if (step === 2) {
        if (allStudents.length === 0) {
          setErr('Please add at least one filter to fetch students')
          return
        }
      }

      if (step === 3) {
        if (selectedStudents.length === 0) {
          setErr('Please select at least one student')
          return
        }
      }
    }

    setStep(stepNumber)
  }

  // ========== CREATE GROUP ==========
  const handleCreate = async () => {
    if (selectedStudents.length === 0) {
      setErr('Please select at least one student')
      return
    }

    setLoading(true)
    setErr('')
    setMsg('')

    try {
      await groupsApi.create({
        name: groupName,
        description: groupDescription,
        memberIds: selectedStudents,
        settings
      })

      setMsg('Group created successfully!')
      
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  // ========== RENDER STEPS ==========
  const renderStep1 = () => (
    <div>
      <h4 style={{ marginBottom: 16 }}>Step 1: Group Information</h4>

      <div style={{ marginBottom: 16 }}>
        <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
          Group Name *
        </label>
        <input
          className="input"
          type="text"
          placeholder="e.g., CSE-DS Year 2 - Project Team Alpha"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          maxLength={100}
          autoFocus
        />
        <div className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
          {groupName.length}/100 characters
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
          Description (Optional)
        </label>
        <textarea
          className="input"
          placeholder="Brief description of the group purpose..."
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <div className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
          {groupDescription.length}/500 characters
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div>
      <h4 style={{ marginBottom: 16 }}>Step 2: Select Students</h4>

      {/* Quick Select Buttons */}
      <div style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
          Quick Select:
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(year => (
            ['A', 'B', 'C'].map(section => (
              <button
                key={`${year}-${section}`}
                type="button"
                className="btn secondary"
                onClick={() => handleQuickSelect(year, section)}
                disabled={loadingStudents}
                style={{ padding: '6px 12px', fontSize: '0.875rem' }}
              >
                Year {year} - {section}
              </button>
            ))
          ))}
        </div>
      </div>

      <div style={{ 
        height: 1, 
        background: 'rgba(255,255,255,0.1)', 
        margin: '16px 0' 
      }} />

      {/* Manual Filter */}
      <div style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
          Or Custom Selection:
        </div>
        <div className="grid grid-2" style={{ gap: 12, marginBottom: 12 }}>
          <div>
            <label className="muted" style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem' }}>
              Year *
            </label>
            <select
              className="input"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              disabled={loadingStudents}
            >
              <option value="">-- Select Year --</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div>
            <label className="muted" style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem' }}>
              Branch *
            </label>
            <input
              className="input"
              value={currentBranch}
              readOnly
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>

          <div>
            <label className="muted" style={{ display: 'block', marginBottom: 4, fontSize: '0.75rem' }}>
              Section *
            </label>
            <select
              className="input"
              value={currentSection}
              onChange={(e) => setCurrentSection(e.target.value)}
              disabled={loadingStudents}
            >
              <option value="">-- Select Section --</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={handleAddFilter}
              disabled={loadingStudents || !currentYear || !currentSection}
              style={{ width: '100%' }}
            >
              {loadingStudents ? '⏳ Loading...' : '➕ Add Filter'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Filters */}
      {selectedFilters.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 8 }}>
            Selected Filters ({selectedFilters.length}):
          </div>
          <div className="grid" style={{ gap: 8 }}>
            {selectedFilters.map((filter, index) => (
              <div
                key={index}
                className="row"
                style={{
                  padding: 8,
                  background: 'rgba(59,130,246,0.1)',
                  borderRadius: 6,
                  border: '1px solid rgba(59,130,246,0.2)',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {filter.label}
                  </div>
                  <div className="muted" style={{ fontSize: '0.75rem' }}>
                    {filter.count} student{filter.count !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => removeFilter(index)}
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Count */}
      {allStudents.length > 0 && (
        <div style={{
          padding: 12,
          background: 'rgba(34,197,94,0.1)',
          borderRadius: 8,
          border: '1px solid rgba(34,197,94,0.2)'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#86efac' }}>
            ✓ {allStudents.length} student{allStudents.length !== 1 ? 's' : ''} loaded
          </div>
          <div className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
            You can select individual students in the next step
          </div>
        </div>
      )}
    </div>
  )

  const renderStep3 = () => {
    const filteredStudents = getFilteredStudents()
    const selectedCount = selectedStudents.length

    return (
      <div>
        <h4 style={{ marginBottom: 16 }}>Step 3: Choose Students</h4>

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
          <input
            className="input"
            type="text"
            placeholder="🔍 Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: '0.875rem' }}>
            {selectedCount} of {allStudents.length} selected
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn secondary"
              onClick={selectAll}
              style={{ padding: '6px 12px', fontSize: '0.875rem' }}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={deselectAll}
              style={{ padding: '6px 12px', fontSize: '0.875rem' }}
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Student List */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: 8
        }}>
          {filteredStudents.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div className="muted">
                {searchTerm ? 'No students found' : 'No students loaded'}
              </div>
            </div>
          ) : (
            <div className="grid" style={{ gap: 6 }}>
              {filteredStudents.map(student => (
                <label
                  key={student._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 8,
                    background: selectedStudents.includes(student._id)
                      ? 'rgba(59,130,246,0.1)'
                      : 'rgba(255,255,255,0.02)',
                    borderRadius: 6,
                    border: `1px solid ${
                      selectedStudents.includes(student._id)
                        ? 'rgba(59,130,246,0.3)'
                        : 'rgba(255,255,255,0.1)'
                    }`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = selectedStudents.includes(student._id)
                      ? 'rgba(59,130,246,0.15)'
                      : 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selectedStudents.includes(student._id)
                      ? 'rgba(59,130,246,0.1)'
                      : 'rgba(255,255,255,0.02)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => toggleStudent(student._id)}
                    style={{ marginRight: 12 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      {student.rollno} - {student.name}
                    </div>
                    <div className="muted" style={{ fontSize: '0.75rem' }}>
                      Year {student.year} {student.branch} - {student.section}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderStep4 = () => (
    <div>
      <h4 style={{ marginBottom: 16 }}>Step 4: Group Settings</h4>

      {/* Summary */}
      <div style={{
        padding: 12,
        background: 'rgba(59,130,246,0.1)',
        borderRadius: 8,
        border: '1px solid rgba(59,130,246,0.2)',
        marginBottom: 16
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: 8 }}>
          Group Summary:
        </div>
        <div className="muted" style={{ fontSize: '0.875rem' }}>
          Name: <strong>{groupName}</strong>
        </div>
        <div className="muted" style={{ fontSize: '0.875rem' }}>
          Members: <strong>{selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}</strong>
        </div>
        {groupDescription && (
          <div className="muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Description: {groupDescription}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="grid" style={{ gap: 12 }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          padding: 12,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.allowStudentMessages}
            onChange={(e) => setSettings({
              ...settings,
              allowStudentMessages: e.target.checked
            })}
            style={{ marginRight: 12 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Allow Student Messages
            </div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              Students can send messages in this group
            </div>
          </div>
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          padding: 12,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.allowFileSharing}
            onChange={(e) => setSettings({
              ...settings,
              allowFileSharing: e.target.checked
            })}
            style={{ marginRight: 12 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Allow File Sharing
            </div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              Members can upload and share files
            </div>
          </div>
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          padding: 12,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.allowMentions}
            onChange={(e) => setSettings({
              ...settings,
              allowMentions: e.target.checked
            })}
            style={{ marginRight: 12 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Allow @Mentions
            </div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              Members can mention others with @
            </div>
          </div>
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          padding: 12,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={settings.allowFreeLeave}
            onChange={(e) => setSettings({
              ...settings,
              allowFreeLeave: e.target.checked
            })}
            style={{ marginRight: 12 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Allow Free Leave
            </div>
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              Students can leave without approval
            </div>
          </div>
        </label>
      </div>
    </div>
  )

  return (
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
        {/* Progress Indicator */}
        <div style={{ marginBottom: 20 }}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  background: s <= step 
                    ? '#60a5fa' 
                    : 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
          <div className="muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
            Step {step} of 4
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Messages */}
        {msg && (
          <div className="tag" style={{ marginTop: 16, borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda' }}>
            ✓ {msg}
          </div>
        )}
        {err && (
          <div className="tag" style={{ marginTop: 16, borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0' }}>
            ✕ {err}
          </div>
        )}

        {/* Navigation */}
        <div className="row" style={{ gap: 12, justifyContent: 'space-between', marginTop: 20 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={step === 1 ? onClose : () => goToStep(step - 1)}
            disabled={loading}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step < 4 ? (
            <button
              type="button"
              className="btn"
              onClick={() => goToStep(step + 1)}
              disabled={loading}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? '⏳ Creating...' : '✓ Create Group'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}