import { api } from './client'

export const noticesApi = {
  // Faculty
  create(formData) {
    return api.post('/api/notice/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  getFacultyNotices() {
    return api.get('/api/notice/faculty/all')
  },
  
  update(id, data) {
    return api.put(`/api/notice/update/${id}`, data)
  },
  
  delete(id) {
    return api.delete(`/api/notice/delete/${id}`)
  },
  
  // Student
  getStudentNotices() {
    return api.get('/api/notice/student/all')
  },
  
  getUnreadCount() {
    return api.get('/api/notice/student/unread-count')
  },
  
  markAsRead(id) {
    return api.post(`/api/notice/student/mark-read/${id}`)
  },
  
  // Common
  getById(id) {
    return api.get(`/api/notice/${id}`)
  }
}