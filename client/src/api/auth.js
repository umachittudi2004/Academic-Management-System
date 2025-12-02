import { api } from './client'

// ROUTES (relative to API base):
// POST   /api/userAuth/studentlogin        { rollno, password }
// POST   /api/userAuth/studentlogout       (cookie auth)
// POST   /api/userAuth/studentUpdate       { Transport?, fatherName?, motherName?, password? } (cookie auth, role student)
// POST   /api/userAuth/facultylogin        { empId, password }
// POST   /api/userAuth/facultylogout       (cookie auth)
// GET    /api/userAuth/checkAuth           (cookie auth) -> { user, role }
// POST   /api/userAuth/facultyupdate       { password? } (cookie auth, role faculty)

export const authApi = {
  checkAuth() {
    return api.get('/api/userAuth/checkAuth')
  },

  studentLogin(payload) {
    return api.post('/api/userAuth/studentlogin', payload)
  },

  studentLogout() {
    return api.post('/api/userAuth/studentlogout')
  },

  updateStudent(payload) {
    return api.post('/api/userAuth/studentUpdate', payload)
  },

  facultyLogin(payload) {
    return api.post('/api/userAuth/facultylogin', payload)
  },

  facultyLogout() {
    return api.post('/api/userAuth/facultylogout')
  },

  updateFaculty(payload) {
    return api.post('/api/userAuth/facultyupdate', payload)
  }
}