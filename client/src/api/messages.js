import { api } from './client'

export const messagesApi = {
    // Send message
    send(formData) {
        return api.post('/api/message/send', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Broadcast (faculty only)
    broadcast(formData) {
        return api.post('/api/message/broadcast', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // Get inbox
    getInbox(filter = 'all') {
        return api.get(`/api/message/inbox?filter=${filter}`)
    },

    // Get sent messages
    getSent() {
        return api.get('/api/message/sent')
    },

    // Get conversation thread
    getThread(threadId) {
        return api.get(`/api/message/thread/${threadId}`)
    },

    // Mark as read
    markAsRead(messageId) {
        return api.post(`/api/message/mark-read/${messageId}`)
    },

    // Get unread count
    getUnreadCount() {
        return api.get('/api/message/unread-count')
    },

    // Get conversations
    getConversations() {
        return api.get('/api/message/conversations')
    },

    // Archive message
    archive(messageId) {
        return api.post(`/api/message/archive/${messageId}`)
    },

    // Delete message
    delete(messageId) {
        return api.delete(`/api/message/${messageId}`)
    },

    // Get student list (faculty only)
    getStudents(params) {
        const query = new URLSearchParams(params).toString()
        return api.get(`/api/message/students?${query}`)
    },

    // Get faculty list (student only)
    getFacultyList() {
        return api.get('/api/message/faculty-list')
    },

    // Get total unread count (direct messages + group messages)
    async getTotalUnreadCount() {
        try {
            // Get direct message unread count
            const directResponse = await this.getUnreadCount()
            const directUnread = directResponse.data.unreadCount || 0

            // Get group unread count
            const { groupsApi } = await import('./groups')
            const groupsResponse = await groupsApi.getStudentGroups()
            const groups = groupsResponse.data.groups || []

            const groupUnread = groups.reduce((total, group) => {
                return total + (group.unreadCount || 0)
            }, 0)

            return {
                total: directUnread + groupUnread,
                direct: directUnread,
                groups: groupUnread
            }
        } catch (error) {
            console.error('Failed to fetch total unread count:', error)
            return { total: 0, direct: 0, groups: 0 }
        }
    }




}