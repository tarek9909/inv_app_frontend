export const ROLES = {
  ADMIN: 'admin',
  INVENTORY: 'inventory',
  ACCOUNTANT: 'accountant'
};

export const USER_STATUSES = ['active', 'inactive', 'blocked'];
export const ACTIVE_STATUSES = ['active', 'inactive'];
export const STOCK_ADJUSTMENT_TYPES = ['adjustment_in', 'adjustment_out'];
export const REQUEST_TYPES = ['stock_out', 'stock_return'];
export const REQUEST_STATUSES = ['draft', 'pending', 'approved', 'completed', 'cancelled'];
export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'other'];
export const PURCHASE_ORDER_STATUSES = ['draft', 'pending', 'partially_received', 'received', 'cancelled'];
