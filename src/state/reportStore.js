import { api } from '../api/index.js';
import { createStore } from './createStore.js';

export const createReportStore = ({ reportsApi = api.reports } = {}) => {
  const store = createStore({
    dashboard: null,
    inventorySummary: null,
    driverBalances: null,
    paymentSummary: null,
    missingPayments: null,
    purchaseSummary: null,
    commissionSummary: null,
    targetKpis: null,
    driverPayroll: null,
    driverDetailReports: null,
    driverDetailReport: null,
    loadingByKey: {},
    loading: false,
    error: null
  });

  const load = async (key, request) => {
    store.setState((state) => ({
      loadingByKey: { ...state.loadingByKey, [key]: true },
      loading: true,
      error: null
    }));
    try {
      const result = await request();
      store.setState((state) => {
        const loadingByKey = { ...state.loadingByKey, [key]: false };
        return { [key]: result.data, loadingByKey, loading: Object.values(loadingByKey).some(Boolean) };
      });
      return result;
    } catch (error) {
      store.setState((state) => {
        const loadingByKey = { ...state.loadingByKey, [key]: false };
        return { loadingByKey, loading: Object.values(loadingByKey).some(Boolean), error };
      });
      throw error;
    }
  };

  return {
    ...store,
    loadDashboard: () => load('dashboard', reportsApi.dashboard),
    loadInventorySummary: () => load('inventorySummary', reportsApi.inventorySummary),
    loadDriverBalances: () => load('driverBalances', reportsApi.driverBalances),
    loadPaymentSummary: () => load('paymentSummary', reportsApi.paymentSummary),
    loadMissingPayments: (params) => load('missingPayments', () => reportsApi.missingPayments(params)),
    loadPurchaseSummary: () => load('purchaseSummary', reportsApi.purchaseSummary),
    loadCommissionSummary: (params) => load('commissionSummary', () => reportsApi.commissionSummary(params)),
    loadTargetKpis: (params) => load('targetKpis', () => reportsApi.targetKpis(params)),
    loadDriverPayroll: (params) => load('driverPayroll', () => reportsApi.driverPayroll(params)),
    loadDriverDetailReports: (params) => load('driverDetailReports', () => reportsApi.driverDetailReports(params)),
    loadDriverDetailReport: (id, params) => load('driverDetailReport', () => reportsApi.driverDetailReport(id, params)),
    clearDriverDetailReport: () => store.setState({ driverDetailReport: null })
  };
};

export const reportStore = createReportStore();
