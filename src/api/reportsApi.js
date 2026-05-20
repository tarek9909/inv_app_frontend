export const createReportsApi = (client) => ({
  dashboard: () => client.get('/reports/dashboard'),
  inventorySummary: (params) => client.get('/reports/inventory-summary', params),
  driverBalances: (params) => client.get('/reports/driver-balances', params),
  paymentSummary: (params) => client.get('/reports/payment-summary', params),
  missingPayments: (params) => client.get('/reports/missing-payments', params),
  purchaseSummary: (params) => client.get('/reports/purchase-summary', params),
  stockMovementReport: (params) => client.get('/reports/stock-movements', params),
  commissionSummary: (params) => client.get('/reports/commission-summary', params),
  targetKpis: (params) => client.get('/reports/target-kpis', params),
  driverPayroll: (params) => client.get('/reports/driver-payroll', params),
  driverDetailReports: (params) => client.get('/reports/drivers/detail', params),
  driverDetailReport: (id, params) => client.get(`/reports/drivers/${id}/detail`, params),
  driverStatement: (id, params) => client.get(`/reports/drivers/${id}/statement`, params),
  driverStatements: (params) => client.get('/reports/driver-statements', params),
  driverAging: (params) => client.get('/reports/driver-aging', params)
});
