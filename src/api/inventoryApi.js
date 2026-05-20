const crud = (client, path) => ({
  list: (params) => client.get(path, params),
  create: (payload) => client.post(path, payload),
  update: (id, payload) => client.patch(`${path}/${id}`, payload),
  setStatus: (id, status) => client.patch(`${path}/${id}/status`, { status }),
  delete: (id) => client.delete(`${path}/${id}`)
});

export const createInventoryApi = (client) => ({
  categories: crud(client, '/categories'),
  suppliers: crud(client, '/suppliers'),
  items: {
    ...crud(client, '/items'),
    lowStock: () => client.get('/items/low-stock'),
    lookup: (code) => client.get('/items/lookup', { code }),
    setStatus: (id, status) => client.patch(`/items/${id}/status`, { status })
  },
  stockEntries: {
    create: (payload) => client.post('/stock-entries', payload)
  },
  stockAdjustments: {
    create: (payload) => client.post('/stock-adjustments', payload)
  },
  stockMovements: {
    list: (params) => client.get('/stock-movements', params)
  },
  batches: {
    list: (params) => client.get('/inventory-batches', params),
    expiryRisk: (params) => client.get('/inventory-batches/expiry-risk', params)
  },
  purchaseOrders: {
    list: (params) => client.get('/purchase-orders', params),
    get: (id) => client.get(`/purchase-orders/${id}`),
    create: (payload) => client.post('/purchase-orders', payload),
    update: (id, payload) => client.patch(`/purchase-orders/${id}`, payload),
    receive: (id, payload) => client.post(`/purchase-orders/${id}/receive`, payload),
    cancel: (id) => client.post(`/purchase-orders/${id}/cancel`)
  }
});
