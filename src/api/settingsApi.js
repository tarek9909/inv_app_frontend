export const createSettingsApi = (client) => ({
  list: () => client.get('/settings'),
  update: (payload) => client.patch('/settings', payload)
});
