export const createDriverApi = (client) => ({
  me: () => client.get('/driver/me'),
  stockRequests: {
    list: () => client.get('/driver/stock-requests'),
    get: (id) => client.get(`/driver/stock-requests/${id}`),
    markInvoiceViewed: (id) => client.post(`/driver/stock-requests/${id}/invoice-viewed`),
    submitReceipt: (id, payload) => client.post(`/driver/stock-requests/${id}/receipt`, payload)
  }
});
