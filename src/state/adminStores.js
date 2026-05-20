import { api } from '../api/index.js';
import { createReadOnlyResourceStore, createResourceStore } from './createResourceStore.js';

export const createAdminStores = ({ adminApi = api.admin } = {}) => ({
  users: {
    ...createResourceStore({ api: adminApi.users }),
    setStatus: (id, status) => adminApi.users.setStatus(id, status),
    resetPassword: adminApi.users.resetPassword
  },
  roles: {
    ...createReferenceStore(adminApi.roles.list),
    create: adminApi.roles.create,
    update: adminApi.roles.update,
    getPermissions: adminApi.roles.getPermissions,
    updatePermissions: adminApi.roles.updatePermissions
  },
  permissions: createReferenceStore(adminApi.permissions.list),
  auditLogs: createReadOnlyResourceStore({ api: { list: adminApi.auditLogs.list } }),
  loginEvents: createReadOnlyResourceStore({ api: { list: adminApi.loginEvents.list } })
});

const createReferenceStore = (loader) => {
  const store = createReadOnlyResourceStore({ api: { list: loader } });
  return {
    ...store,
    load: () => store.load()
  };
};

export const adminStores = createAdminStores();
