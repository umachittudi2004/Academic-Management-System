import { api } from './client'

// ROUTES:
// POST /api/attendence/startattendencesession  { subjectId, year, branch, section } (cookie; backend adds both studentAuthCheck & facultyAuthCheck)
// GET  /api/attendence/checkattendencesession  (student cookie)
// GET  /api/attendence/markattendence/:id      (student cookie + IP check), id = subjectId

export const attendanceApi = {
  startSession(payload) {
    return api.post('/api/attendence/startattendencesession', payload)
  },
  checkSessions() {
    return api.get('/api/attendence/checkattendencesession')
  },
  mark(subjectId) {
    return api.get(`/api/attendence/markattendence/${subjectId}`)
  }
}