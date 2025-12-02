import { api } from './client'

export const timetableApi = {
  // Faculty
  create(data) {
    return api.post('/api/timetable/create', data)
  },
  
  getFacultyTimetable() {
    return api.get('/api/timetable/faculty')
  },
  
  getCurrentPeriod() {
    return api.get('/api/timetable/current-period')
  },
  
  delete(id) {
    return api.delete(`/api/timetable/delete/${id}`)
  },

  // Student
  getStudentTimetable() {
    return api.get('/api/timetable/student')
  }
}