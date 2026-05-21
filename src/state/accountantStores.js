import { api } from '../api/index.js';
import { createResourceStore } from './createResourceStore.js';

export const createAccountantStores = ({ accountantApi = api.accountant } = {}) => ({
  drivers: {
    ...createResourceStore({ api: accountantApi.drivers }),
    setStatus: accountantApi.drivers.setStatus,
    loadBalance: accountantApi.drivers.balance,
    loadStatement: accountantApi.drivers.statement,
    loadLocationHistory: accountantApi.drivers.locationHistory
  },
  locations: {
    ...createResourceStore({ api: accountantApi.locations }),
    setStatus: accountantApi.locations.setStatus
  },
  commissionRules: {
    ...createResourceStore({ api: accountantApi.commissionRules }),
    setStatus: accountantApi.commissionRules.setStatus
  },
  monthlyTargets: {
    ...createResourceStore({ api: accountantApi.monthlyTargets }),
    setStatus: accountantApi.monthlyTargets.setStatus
  },
  stockRequests: {
    ...createResourceStore({ api: accountantApi.stockRequests }),
    loadOne: accountantApi.stockRequests.get,
    accept: accountantApi.stockRequests.accept,
    complete: accountantApi.stockRequests.complete,
    reconcile: accountantApi.stockRequests.reconcile,
    cancel: accountantApi.stockRequests.cancel,
    print: accountantApi.stockRequests.print
  },
  payments: createResourceStore({ api: accountantApi.payments })
});

export const accountantStores = createAccountantStores();
