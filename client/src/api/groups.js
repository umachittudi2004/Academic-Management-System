import { api } from './client'

export const groupsApi = {
  // ========== GROUP MANAGEMENT ==========
  
  // Create Group (Faculty)
  create(data) {
    return api.post('/api/group/create', data)
  },

  // Get Faculty Groups
  getFacultyGroups() {
    return api.get('/api/group/faculty')
  },

  // Get Student Groups
  getStudentGroups() {
    return api.get('/api/group/student')
  },

  // Get Group Details
  getDetails(groupId) {
    return api.get(`/api/group/${groupId}`)
  },

  // Add Members (Faculty)
  addMembers(groupId, memberIds) {
    return api.post(`/api/group/${groupId}/members/add`, { memberIds })
  },

  // Remove Member (Faculty)
  removeMember(groupId, memberId) {
    return api.post(`/api/group/${groupId}/members/remove`, { memberId })
  },

  // Update Group Settings (Faculty)
  updateSettings(groupId, settings) {
    return api.put(`/api/group/${groupId}/settings`, { settings })
  },

  // Update Group Info (Faculty)
  updateInfo(groupId, data) {
    return api.put(`/api/group/${groupId}/info`, data)
  },

  // Delete Group (Faculty)
  delete(groupId) {
    return api.delete(`/api/group/${groupId}`)
  },

  // Toggle Mute Group
  toggleMute(groupId) {
    return api.post(`/api/group/${groupId}/mute`)
  },

  // ========== LEAVE GROUP (STUDENT) ==========
  
  // Leave Group
  leaveGroup(groupId, reason) {
    return api.post(`/api/group/${groupId}/leave`, { reason })
  },

  // Handle Leave Request (Faculty)
  handleLeaveRequest(groupId, memberId, approved) {
    return api.post(`/api/group/${groupId}/leave-request/handle`, {
      memberId,
      approved
    })
  },

  // Get Pending Leave Requests (Faculty)
  getPendingLeaveRequests() {
    return api.get('/api/group/leave-requests/pending')
  },

  // ========== GROUP MESSAGING ==========
  
  // Send Message in Group
  sendMessage(groupId, formData) {
    return api.post(`/api/group/${groupId}/messages/send`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Get Group Messages
  getMessages(groupId, params = {}) {
    const query = new URLSearchParams(params).toString()
    return api.get(`/api/group/${groupId}/messages?${query}`)
  },

  // Search Messages in Group
  searchMessages(groupId, searchTerm, limit = 50) {
    return api.get(`/api/group/${groupId}/messages/search?q=${searchTerm}&limit=${limit}`)
  },

  // Send Typing Indicator
  sendTyping(groupId, isTyping) {
    return api.post(`/api/group/${groupId}/typing`, {
      groupId,
      isTyping
    })
  },

  // Delete Message
  deleteMessage(messageId) {
    return api.delete(`/api/group/messages/${messageId}`)
  }
}