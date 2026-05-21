export const createAdminApi = (client) => ({
  users: {
    list: (params) => client.get('/users', params),
    create: (payload) => client.post('/users', payload),
    update: (id, payload) => client.patch(`/users/${id}`, payload),
    setStatus: (id, status) => client.patch(`/users/${id}/status`, { status }),
    resetPassword: (id, temporary_password, options = {}) => client.post(`/users/${id}/reset-password`, { temporary_password, ...options })
  },
  roles: {
    list: () => client.get('/roles'),
    create: (payload) => client.post('/roles', payload),
    update: (id, payload) => client.patch(`/roles/${id}`, payload),
    getPermissions: (id) => client.get(`/roles/${id}/permissions`),
    updatePermissions: (id, permissions) => client.patch(`/roles/${id}/permissions`, { permissions })
  },
  permissions: {
    list: () => client.get('/permissions')
  },
  auditLogs: {
    list: (params) => client.get('/audit-logs', params)
  },
  loginEvents: {
    list: (params) => client.get('/login-events', params)
  }
});
