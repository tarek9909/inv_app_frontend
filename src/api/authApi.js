export const createAuthApi = (client) => ({
  login: (credentials) => client.post('/auth/login', credentials),
  me: () => client.get('/auth/me'),
  updateProfile: (payload) => client.patch('/auth/me/profile', payload),
  changePassword: (payload) => client.patch('/auth/me/password', payload),
  logout: () => client.post('/auth/logout')
});
