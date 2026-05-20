export const createNotificationApi = (client) => ({
  list: (params) => client.get('/notifications', params),
  markRead: (id) => client.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => client.patch('/notifications/read-all', {})
});
