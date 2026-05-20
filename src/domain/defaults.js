export const emptyPagination = { page: 1, limit: 20, search: '' };

export const createPurchaseOrderDraft = () => ({
  supplier_id: null,
  order_date: todayIsoDate(),
  expected_delivery_date: null,
  discount_amount: 0,
  tax_amount: 0,
  notes: '',
  items: []
});

export const createStockRequestDraft = () => ({
  driver_id: null,
  request_date: todayIsoDate(),
  request_type: 'stock_out',
  discount_amount: 0,
  notes: '',
  items: []
});

export const todayIsoDate = () => new Date().toISOString().slice(0, 10);
