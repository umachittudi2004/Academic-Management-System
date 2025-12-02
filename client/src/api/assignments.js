import { api } from './client'

export const assignmentsApi = {
  // Faculty
  create(formData) {
    return api.post('/api/assignment/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'  // ← ADD THIS
      }
    })
  },
  
  getFacultyAssignments() {
    return api.get('/api/assignment/faculty')
  },
  
  getDetails(id) {
    return api.get(`/api/assignment/${id}`)
  },
  
  update(id, data) {
    return api.put(`/api/assignment/update/${id}`, data)
  },
  
  delete(id) {
    return api.delete(`/api/assignment/delete/${id}`)
  },
  
  getSubmissions(id) {
    return api.get(`/api/assignment/${id}/submissions`)
  },
  
  gradeSubmission(data) {
    return api.post('/api/assignment/grade', data)
  },
  
  getStats(id) {
    return api.get(`/api/assignment/${id}/stats`)
  },

  // Student
  getStudentAssignments() {
    return api.get('/api/assignment/student')
  },
  
  submit(formData) {
    return api.post('/api/assignment/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'  // ← ADD THIS TOO
      }
    })
  },
  
  getMySubmission(id) {
    return api.get(`/api/assignment/${id}/my-submission`)
  },
  
  getMyGrade(id) {
    return api.get(`/api/assignment/${id}/my-grade`)
  }
}