export const createAttachmentApi = (client) => ({
  upload: (payload) => client.post('/attachments', payload),
  list: (params) => client.get('/attachments', params),
  downloadUrl: (id, baseUrl = '') => `${baseUrl}/attachments/${id}/download`,
  delete: (id) => client.delete(`/attachments/${id}`)
});
