import { useState, useRef, useEffect } from 'react'

export default function MentionInput({ 
  value, 
  onChange, 
  onMentionSelect,
  members = [],
  placeholder = "Type a message...",
  disabled = false,
  onKeyPress,
  rows = 1
}) {
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const textareaRef = useRef(null)

  // Filter members based on mention search
  const filteredMembers = members.filter(member =>
    member.userName.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    (member.rollNumber && member.rollNumber.toLowerCase().includes(mentionSearch.toLowerCase()))
  )

  // Handle text change
  const handleChange = (e) => {
    const newValue = e.target.value
    const newCursorPos = e.target.selectionStart

    onChange(newValue)
    setCursorPosition(newCursorPos)

    // Check if @ was typed
    const textBeforeCursor = newValue.substring(0, newCursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      
      // Check if we're in a mention context (no space after @)
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt)
        setMentionPosition(lastAtIndex)
        setShowMentionList(true)
        setSelectedMentionIndex(0)
      } else {
        setShowMentionList(false)
      }
    } else {
      setShowMentionList(false)
    }
  }

  // Handle mention selection
  const selectMention = (member) => {
    const beforeMention = value.substring(0, mentionPosition)
    const afterCursor = value.substring(cursorPosition)
    
    // Replace @search with @Username
    const newValue = `${beforeMention}@${member.userName} ${afterCursor}`
    
    onChange(newValue)
    onMentionSelect && onMentionSelect(member)
    
    setShowMentionList(false)
    setMentionSearch('')
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      const newCursorPos = beforeMention.length + member.userName.length + 2
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Handle keyboard navigation in mention list
  const handleKeyDown = (e) => {
    if (showMentionList && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        )
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        selectMention(filteredMembers[selectedMentionIndex])
      } else if (e.key === 'Escape') {
        setShowMentionList(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      onKeyPress && onKeyPress(e)
    }
  }

  // Close mention list when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMentionList(false)
    }

    if (showMentionList) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMentionList])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <textarea
        ref={textareaRef}
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={rows}
        style={{ 
          resize: 'none',
          minHeight: '42px',
          maxHeight: '120px',
          width: '100%'
        }}
      />

      {/* Mention Autocomplete Dropdown */}
      {showMentionList && filteredMembers.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          background: '#1a1a1a',
          border: '1px solid rgba(147,197,253,0.3)',
          borderRadius: 8,
          marginBottom: 8,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
          zIndex: 1000
        }}>
          <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            Mention someone
          </div>
          {filteredMembers.map((member, index) => (
            <div
              key={member.userId}
              onClick={(e) => {
                e.stopPropagation()
                selectMention(member)
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: index === selectedMentionIndex 
                  ? 'rgba(59,130,246,0.2)' 
                  : 'transparent',
                borderLeft: index === selectedMentionIndex 
                  ? '3px solid #60a5fa' 
                  : '3px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={() => setSelectedMentionIndex(index)}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                {member.userName}
              </div>
              {member.rollNumber && (
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {member.rollNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}