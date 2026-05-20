import { api } from '../api/index.js';
import { createStore } from './createStore.js';

export const createReportStore = ({ reportsApi = api.reports } = {}) => {
  const inFlightLoads = new Map();
  const resultCache = new Map();
  const reportCacheMs = 10000;
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

  const getRequestKey = (key, params) => JSON.stringify({ key, params: params || {} });

  const load = async (key, request, params) => {
    const requestKey = getRequestKey(key, params);
    const cached = resultCache.get(requestKey);
    if (cached && Date.now() - cached.at < reportCacheMs) {
      store.setState({ [key]: cached.result.data, error: null });
      return cached.result;
    }
    if (cached) resultCache.delete(requestKey);
    if (inFlightLoads.has(requestKey)) return inFlightLoads.get(requestKey);

    store.setState((state) => ({
      loadingByKey: { ...state.loadingByKey, [key]: true },
      loading: true,
      error: null
    }));
    const promise = (async () => {
      const result = await request();
      store.setState((state) => {
        const loadingByKey = { ...state.loadingByKey, [key]: false };
        return { [key]: result.data, loadingByKey, loading: Object.values(loadingByKey).some(Boolean) };
      });
      resultCache.set(requestKey, { at: Date.now(), result });
      return result;
    })();
    inFlightLoads.set(requestKey, promise);

    try {
      return await promise;
    } catch (error) {
      store.setState((state) => {
        const loadingByKey = { ...state.loadingByKey, [key]: false };
        return { loadingByKey, loading: Object.values(loadingByKey).some(Boolean), error };
      });
      throw error;
    } finally {
      inFlightLoads.delete(requestKey);
    }
  };

  return {
    ...store,
    loadDashboard: () => load('dashboard', reportsApi.dashboard),
    loadInventorySummary: () => load('inventorySummary', reportsApi.inventorySummary),
    loadDriverBalances: () => load('driverBalances', reportsApi.driverBalances),
    loadPaymentSummary: () => load('paymentSummary', reportsApi.paymentSummary),
    loadMissingPayments: (params) => load('missingPayments', () => reportsApi.missingPayments(params), params),
    loadPurchaseSummary: () => load('purchaseSummary', reportsApi.purchaseSummary),
    loadCommissionSummary: (params) => load('commissionSummary', () => reportsApi.commissionSummary(params), params),
    loadTargetKpis: (params) => load('targetKpis', () => reportsApi.targetKpis(params), params),
    loadDriverPayroll: (params) => load('driverPayroll', () => reportsApi.driverPayroll(params), params),
    loadDriverDetailReports: (params) => load('driverDetailReports', () => reportsApi.driverDetailReports(params), params),
    loadDriverDetailReport: (id, params) => load('driverDetailReport', () => reportsApi.driverDetailReport(id, params), { id, ...params }),
    clearDriverDetailReport: () => store.setState({ driverDetailReport: null }),
    clearCache: () => resultCache.clear()
  };
};

export const reportStore = createReportStore();
