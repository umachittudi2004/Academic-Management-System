import { api } from './client'

export const studentsApi = {
  // Get all students (for faculty)
  getAll(params = {}) {
    const query = new URLSearchParams(params).toString()
    return api.get(`/api/message/students?${query}`)
  },

  // Get students by filters
  getByFilter(year, branch, section) {
    const params = {}
    if (year) params.year = year
    if (branch) params.branch = branch
    if (section) params.section = section
    
    const query = new URLSearchParams(params).toString()
    return api.get(`/api/message/students?${query}`)
  },

  // Search students
  search(searchTerm) {
    return api.get(`/api/message/students?search=${searchTerm}`)
  }
}