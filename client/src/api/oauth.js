import { api } from './client'

export const oauthApi = {
  uploadFile(formData) {
    return api.post('/api/oauth/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  downloadFile(fileId) {
    return api.get(`/api/oauth/download/${fileId}`)
  },

  viewFile(fileId) {
    return api.get(`/api/oauth/view/${fileId}`)
  }
}