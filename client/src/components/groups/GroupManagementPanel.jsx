import { useState, useEffect } from 'react'
import { groupsApi } from '../../api/groups'
import { studentsApi } from '../../api/students'
import { useAuth } from '../../state/AuthContext'

export default function GroupManagementPanel({ group, onClose, onUpdate, onDelete }) {
    const { role } = useAuth()
    const [activeTab, setActiveTab] = useState('members')
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')
    const [msg, setMsg] = useState('')

    // Add Members State
    const [showAddMembers, setShowAddMembers] = useState(false)
    const [selectedYear, setSelectedYear] = useState('')
    const [selectedSection, setSelectedSection] = useState('')
    const [availableStudents, setAvailableStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    // Settings State
    const [settings, setSettings] = useState(group.settings || {})

    const isCreator = group.createdBy === (role === 'faculty' ? group.createdBy : null)

    // Fetch available students
    const fetchStudents = async () => {
        if (!selectedYear || !selectedSection) return

        setLoading(true)
        setErr('')
        try {
            const { data } = await studentsApi.getByFilter(selectedYear, 'CSE-DS', selectedSection)
            // Filter out students already in group
            const currentMemberIds = group.members.map(m => m.userId.toString())
            const available = data.students.filter(s => !currentMemberIds.includes(s._id.toString()))
            setAvailableStudents(available)
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to fetch students')
        } finally {
            setLoading(false)
        }
    }

    // Add members
    const handleAddMembers = async () => {
        if (selectedStudents.length === 0) {
            setErr('Please select at least one student')
            return
        }

        setLoading(true)
        setErr('')
        setMsg('')

        try {
            await groupsApi.addMembers(group._id, selectedStudents)
            setMsg(`${selectedStudents.length} member(s) added successfully!`)
            setSelectedStudents([])
            setShowAddMembers(false)
            setTimeout(() => {
                onUpdate()
                onClose()
            }, 1500)
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to add members')
        } finally {
            setLoading(false)
        }
    }

    // Remove member
    const handleRemoveMember = async (memberId) => {
        if (!confirm('Remove this member from the group?')) return

        setLoading(true)
        setErr('')
        setMsg('')

        try {
            await groupsApi.removeMember(group._id, memberId)
            setMsg('Member removed successfully!')
            setTimeout(() => {
                onUpdate()
            }, 1000)
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to remove member')
        } finally {
            setLoading(false)
        }
    }

    // Update settings
    const handleUpdateSettings = async () => {
        setLoading(true)
        setErr('')
        setMsg('')

        try {
            await groupsApi.updateSettings(group._id, settings)
            setMsg('Settings updated successfully!')
            setTimeout(() => {
                onUpdate()
                onClose()
            }, 1500)
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to update settings')
        } finally {
            setLoading(false)
        }
    }

    // Delete group
    const handleDeleteGroup = async () => {
        const confirmText = prompt(
            `⚠️ WARNING: This will permanently delete the group and all messages!\n\nType "${group.name}" to confirm deletion:`
        )

        if (confirmText !== group.name) {
            alert('Group name does not match. Deletion cancelled.')
            return
        }

        setLoading(true)
        setErr('')

        try {
            await groupsApi.delete(group._id)
            alert('Group deleted successfully')
            onDelete()
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to delete group')
        } finally {
            setLoading(false)
        }
    }

    // Leave group (student)
    const handleLeaveGroup = async () => {
        const reason = prompt('Why do you want to leave this group? (Optional)')
        
        if (reason === null) return // Cancelled

        setLoading(true)
        setErr('')

        try {
            const { data } = await groupsApi.leaveGroup(group._id, reason)
            
            if (data.requiresApproval) {
                alert('Leave request sent. Waiting for admin approval.')
                onClose()
            } else {
                alert('You have left the group')
                onDelete()
            }
        } catch (error) {
            setErr(error?.response?.data?.message || 'Failed to leave group')
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = availableStudents.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollno.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h4 style={{ marginBottom: 16 }}>Group Management</h4>

                {/* Tabs */}
                <div className="row" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${activeTab === 'members' ? '' : 'secondary'}`}
                        onClick={() => setActiveTab('members')}
                        style={{ flex: 1, minWidth: 100 }}
                    >
                        👥 Members
                    </button>
                    {isCreator && (
                        <>
                            <button
                                className={`btn ${activeTab === 'settings' ? '' : 'secondary'}`}
                                onClick={() => setActiveTab('settings')}
                                style={{ flex: 1, minWidth: 100 }}
                            >
                                ⚙️ Settings
                            </button>
                            <button
                                className={`btn ${activeTab === 'danger' ? 'danger' : 'secondary'}`}
                                onClick={() => setActiveTab('danger')}
                                style={{ flex: 1, minWidth: 100 }}
                            >
                                ⚠️ Danger
                            </button>
                        </>
                    )}
                    {role === 'student' && (
                        <button
                            className="btn danger"
                            onClick={() => setActiveTab('leave')}
                            style={{ flex: 1, minWidth: 100 }}
                        >
                            🚪 Leave
                        </button>
                    )}
                </div>

                {/* Error/Success Messages */}
                {err && (
                    <div className="tag" style={{ borderColor: 'rgba(255,107,107,0.5)', color: '#ffb0b0', marginBottom: 12 }}>
                        ✕ {err}
                    </div>
                )}
                {msg && (
                    <div className="tag" style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#c6ffda', marginBottom: 12 }}>
                        ✓ {msg}
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div>
                        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h5>Members ({group.members?.length || 0})</h5>
                            {isCreator && (
                                <button
                                    className="btn"
                                    onClick={() => setShowAddMembers(!showAddMembers)}
                                    style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                                >
                                    {showAddMembers ? '✕ Cancel' : '➕ Add Members'}
                                </button>
                            )}
                        </div>

                        {/* Add Members Section */}
                        {showAddMembers && (
                            <div style={{
                                marginBottom: 16,
                                padding: 12,
                                background: 'rgba(59,130,246,0.1)',
                                borderRadius: 8,
                                border: '1px solid rgba(59,130,246,0.2)'
                            }}>
                                <h6 style={{ marginBottom: 12 }}>Add New Members</h6>

                                <div className="grid grid-2" style={{ gap: 12, marginBottom: 12 }}>
                                    <select
                                        className="input"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        <option value="">-- Select Year --</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                    </select>

                                    <select
                                        className="input"
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                    >
                                        <option value="">-- Select Section --</option>
                                        <option value="A">Section A</option>
                                        <option value="B">Section B</option>
                                        <option value="C">Section C</option>
                                    </select>
                                </div>

                                <button
                                    className="btn secondary"
                                    onClick={fetchStudents}
                                    disabled={!selectedYear || !selectedSection || loading}
                                    style={{ marginBottom: 12, width: '100%' }}
                                >
                                    {loading ? '⏳ Loading...' : '🔍 Fetch Students'}
                                </button>

                                {availableStudents.length > 0 && (
                                    <>
                                        <input
                                            className="input"
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ marginBottom: 12 }}
                                        />

                                        <div style={{
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 6,
                                            padding: 8,
                                            marginBottom: 12
                                        }}>
                                            {filteredStudents.map(student => (
                                                <label
                                                    key={student._id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: 8,
                                                        background: selectedStudents.includes(student._id)
                                                            ? 'rgba(59,130,246,0.1)'
                                                            : 'transparent',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        marginBottom: 4
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(student._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedStudents([...selectedStudents, student._id])
                                                            } else {
                                                                setSelectedStudents(selectedStudents.filter(id => id !== student._id))
                                                            }
                                                        }}
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

                                        <button
                                            className="btn"
                                            onClick={handleAddMembers}
                                            disabled={selectedStudents.length === 0 || loading}
                                            style={{ width: '100%' }}
                                        >
                                            {loading ? '⏳ Adding...' : `✓ Add ${selectedStudents.length} Student(s)`}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <div className="grid" style={{ gap: 8 }}>
                            {group.members?.map(member => (
                                <div
                                    key={member.userId}
                                    className="row"
                                    style={{
                                        padding: 12,
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                            {member.userName}
                                            {member.role === 'admin' && (
                                                <span style={{
                                                    marginLeft: 8,
                                                    fontSize: '0.75rem',
                                                    color: '#fbbf24'
                                                }}>
                                                    👑 Admin
                                                </span>
                                            )}
                                        </div>
                                        {member.rollNumber && (
                                            <div className="muted" style={{ fontSize: '0.75rem' }}>
                                                {member.rollNumber}
                                            </div>
                                        )}
                                    </div>
                                    {isCreator && member.role !== 'admin' && (
                                        <button
                                            className="btn danger"
                                            onClick={() => handleRemoveMember(member.userId)}
                                            disabled={loading}
                                            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && isCreator && (
                    <div>
                        <h5 style={{ marginBottom: 12 }}>Group Settings</h5>

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
                                <div>
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
                                <div>
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
                                <div>
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
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                        Allow Free Leave
                                    </div>
                                    <div className="muted" style={{ fontSize: '0.75rem' }}>
                                        Students can leave without approval
                                    </div>
                                </div>
                            </label>
                        </div>

                        <button
                            className="btn"
                            onClick={handleUpdateSettings}
                            disabled={loading}
                            style={{ width: '100%', marginTop: 16 }}
                        >
                            {loading ? '⏳ Updating...' : '✓ Save Settings'}
                        </button>
                    </div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === 'danger' && isCreator && (
                    <div>
                        <h5 style={{ marginBottom: 12, color: '#ef4444' }}>⚠️ Danger Zone</h5>

                        <div style={{
                            padding: 16,
                            background: 'rgba(239,68,68,0.1)',
                            borderRadius: 8,
                            border: '1px solid rgba(239,68,68,0.3)'
                        }}>
                            <h6 style={{ marginBottom: 8, color: '#ef4444' }}>Delete Group</h6>
                            <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                                Permanently delete this group and all its messages. This action cannot be undone.
                            </div>
                            <button
                                className="btn danger"
                                onClick={handleDeleteGroup}
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                {loading ? '⏳ Deleting...' : '🗑️ Delete Group Permanently'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Leave Group Tab (Student) */}
                {activeTab === 'leave' && role === 'student' && (
                    <div>
                        <h5 style={{ marginBottom: 12, color: '#fbbf24' }}>🚪 Leave Group</h5>

                        <div style={{
                            padding: 16,
                            background: 'rgba(251,191,36,0.1)',
                            borderRadius: 8,
                            border: '1px solid rgba(251,191,36,0.3)'
                        }}>
                            <div className="muted" style={{ fontSize: '0.875rem', marginBottom: 12 }}>
                                {group.settings?.allowFreeLeave
                                    ? 'You can leave this group immediately.'
                                    : 'Leaving this group requires admin approval. Your request will be sent to the group admin.'}
                            </div>
                            <button
                                className="btn danger"
                                onClick={handleLeaveGroup}
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                {loading ? '⏳ Processing...' : '🚪 Leave Group'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <button
                    className="btn secondary"
                    onClick={onClose}
                    style={{ width: '100%', marginTop: 16 }}
                >
                    Close
                </button>
            </div>
        </div>
    )
}