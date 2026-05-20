export const createAccountantApi = (client) => ({
  drivers: {
    list: (params) => client.get('/drivers', params),
    create: (payload) => client.post('/drivers', payload),
    update: (id, payload) => client.patch(`/drivers/${id}`, payload),
    delete: (id) => client.delete(`/drivers/${id}`),
    setStatus: (id, status) => client.patch(`/drivers/${id}/status`, { status }),
    balance: (id) => client.get(`/drivers/${id}/balance`),
    statement: (id, params) => client.get(`/drivers/${id}/statement`, params),
    locationHistory: (id) => client.get(`/drivers/${id}/location-history`)
  },
  locations: {
    list: (params) => client.get('/locations', params),
    create: (payload) => client.post('/locations', payload),
    update: (id, payload) => client.patch(`/locations/${id}`, payload),
    setStatus: (id, status) => client.patch(`/locations/${id}/status`, { status })
  },
  commissionRules: {
    list: (params) => client.get('/commission-rules', params),
    create: (payload) => client.post('/commission-rules', payload),
    update: (id, payload) => client.patch(`/commission-rules/${id}`, payload),
    setStatus: (id, status) => client.patch(`/commission-rules/${id}/status`, { status })
  },
  monthlyTargets: {
    list: (params) => client.get('/monthly-targets', params),
    create: (payload) => client.post('/monthly-targets', payload),
    update: (id, payload) => client.patch(`/monthly-targets/${id}`, payload),
    setStatus: (id, status) => client.patch(`/monthly-targets/${id}/status`, { status })
  },
  stockRequests: {
    list: (params) => client.get('/stock-requests', params),
    get: (id) => client.get(`/stock-requests/${id}`),
    create: (payload) => client.post('/stock-requests', payload),
    update: (id, payload) => client.patch(`/stock-requests/${id}`, payload),
    accept: (id) => client.post(`/stock-requests/${id}/accept`),
    complete: (id, payload) => client.post(`/stock-requests/${id}/complete`, payload),
    cancel: (id) => client.post(`/stock-requests/${id}/cancel`),
    print: (id, payload) => client.post(`/stock-requests/${id}/print`, payload)
  },
  payments: {
    list: (params) => client.get('/payments', params),
    create: (payload) => client.post('/payments', payload)
  }
});
