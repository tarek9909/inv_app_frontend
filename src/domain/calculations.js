export const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const roundMoney = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

export const calculatePurchaseOrderTotals = (draft) => {
  const subtotal = (draft.items || []).reduce((sum, item) => {
    return sum + toNumber(item.ordered_quantity) * toNumber(item.unit_cost);
  }, 0);
  const discount = toNumber(draft.discount_amount);
  const tax = toNumber(draft.tax_amount);
  return {
    subtotal: roundMoney(subtotal),
    discount_amount: roundMoney(discount),
    tax_amount: roundMoney(tax),
    total_amount: roundMoney(Math.max(subtotal - discount + tax, 0))
  };
};

export const calculateStockRequestTotals = (draft) => {
  const subtotal = (draft.items || []).reduce((sum, item) => {
    return sum + toNumber(item.quantity) * toNumber(item.unit_price);
  }, 0);
  const discount = toNumber(draft.discount_amount);
  return {
    subtotal: roundMoney(subtotal),
    discount_amount: roundMoney(discount),
    total_amount: roundMoney(Math.max(subtotal - discount, 0))
  };
};
