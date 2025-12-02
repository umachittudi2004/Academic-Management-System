import { api } from './client'

// ROUTES:
// POST /api/subject/createsubject        { subjectName, subjectCode, year, section, branch } (student cookie)
// GET  /api/subject/getallsubjects       (student cookie)
// POST /api/subject/getsubjectbyid       { subjectIds: [] } (student cookie)

export const subjectsApi = {
  create(data) {
    return api.post('/api/subject/createsubject', data)
  },
  getAll() {
    return api.get('/api/subject/getallsubjects')
  },
  getByIds(subjectIds) {
    return api.post('/api/subject/getsubjectbyid', { subjectIds })
  },
  getByFaculty(){
    return api.get('/api/subject/getsubjectsbyfaculty')
  },
  getsubjectbyyearbranchsection(){
    return api.get('/api/subject/getsubjectbyyearbranchsection')
  }
}