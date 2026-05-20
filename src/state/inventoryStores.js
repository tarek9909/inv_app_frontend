import { api } from '../api/index.js';
import { createReadOnlyResourceStore, createResourceStore } from './createResourceStore.js';

export const createInventoryStores = ({ inventoryApi = api.inventory } = {}) => ({
  categories: {
    ...createResourceStore({ api: inventoryApi.categories }),
    setStatus: inventoryApi.categories.setStatus
  },
  suppliers: {
    ...createResourceStore({ api: inventoryApi.suppliers }),
    setStatus: inventoryApi.suppliers.setStatus
  },
  items: {
    ...createResourceStore({ api: inventoryApi.items }),
    loadLowStock: inventoryApi.items.lowStock,
    lookup: inventoryApi.items.lookup,
    setStatus: inventoryApi.items.setStatus
  },
  stockMovements: createReadOnlyResourceStore({ api: { list: inventoryApi.stockMovements.list } }),
  batches: createReadOnlyResourceStore({ api: { list: inventoryApi.batches.list } }),
  expiryRisk: createCommandState(inventoryApi.batches.expiryRisk),
  stockEntries: createCommandState(inventoryApi.stockEntries.create),
  stockAdjustments: createCommandState(inventoryApi.stockAdjustments.create),
  purchaseOrders: {
    ...createResourceStore({ api: inventoryApi.purchaseOrders }),
    loadOne: inventoryApi.purchaseOrders.get,
    receive: inventoryApi.purchaseOrders.receive,
    cancel: inventoryApi.purchaseOrders.cancel
  }
});

const createCommandState = (command) => ({
  saving: false,
  error: null,
  async submit(payload) {
    this.saving = true;
    this.error = null;
    try {
      return await command(payload);
    } catch (error) {
      this.error = error;
      throw error;
    } finally {
      this.saving = false;
    }
  }
});

export const inventoryStores = createInventoryStores();
