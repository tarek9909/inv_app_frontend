import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Eye, CheckCircle, XCircle, Edit, Search, AlertCircle, RefreshCw, ShoppingCart, Calendar, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/DataTable.jsx';
import StatusPipeline from '../../components/StatusPipeline.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, FormTextarea, SubmitButton } from '../../components/FormField.jsx';
import { toast } from '../../components/Toast.jsx';
import { authStore, inventoryStores } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { createPurchaseOrderDraft, calculatePurchaseOrderTotals, todayIsoDate } from '../../domain/index.js';

export default function PurchaseOrdersTab() {
  const { rows, meta, loading, error } = useStore(inventoryStores.purchaseOrders);
  const supState = useStore(inventoryStores.suppliers);
  const itemState = useStore(inventoryStores.items);
  const { user } = useStore(authStore);

  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(createPurchaseOrderDraft());
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [receiveModal, setReceiveModal] = useState(null);
  const [receiveForm, setReceiveForm] = useState([]);
  const [receiveSaving, setReceiveSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    inventoryStores.purchaseOrders.load();
    inventoryStores.suppliers.load();
    inventoryStores.items.load();
  }, []);

  const openCreate = () => {
    setDraft(createPurchaseOrderDraft());
    setFormOpen(true);
  };

  const addLineItem = () => {
    setDraft({ ...draft, items: [...draft.items, { item_id: '', ordered_quantity: '', unit_cost: '' }] });
  };

  const updateLineItem = (idx, field, value) => {
    const items = [...draft.items];
    items[idx] = { ...items[idx], [field]: value };
    setDraft({ ...draft, items });
  };

  const updateLineItemValues = (idx, values) => {
    const items = [...draft.items];
    items[idx] = { ...items[idx], ...values };
    setDraft({ ...draft, items });
  };

  const removeLineItem = (idx) => {
    setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) });
  };

  const totals = calculatePurchaseOrderTotals(draft);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.supplier_id) { toast.error('Please select a supplier'); return; }
    if (!draft.items.length) { toast.error('Add at least one line item'); return; }
    for (const item of draft.items) {
      if (!item.item_id || !item.ordered_quantity || Number(item.ordered_quantity) <= 0) {
        toast.error('All line items must have an item and valid quantity'); return;
      }
    }

    setSaving(true);
    try {
      const payload = { ...draft, ...totals, items: draft.items.map((i) => ({ item_id: Number(i.item_id), ordered_quantity: Number(i.ordered_quantity), unit_cost: Number(i.unit_cost) || 0 })) };
      await inventoryStores.purchaseOrders.create(payload);
      toast.success('Purchase order created');
      setFormOpen(false);
      inventoryStores.purchaseOrders.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      await inventoryStores.purchaseOrders.cancel(confirmCancel.id);
      toast.success('Order cancelled');
      inventoryStores.purchaseOrders.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel');
    }
    setConfirmCancel(null);
  };

  const openDetail = async (order) => {
    try {
      const result = await inventoryStores.purchaseOrders.loadOne(order.id);
      setDetail(result.data || order);
    } catch (err) {
      toast.error(err?.message || 'Failed to load purchase order');
    }
  };

  const openReceive = (order) => {
    setReceiveModal(order);
    setReceiveForm((order.items || []).map((line) => ({
      purchase_order_item_id: line.id,
      item_name: line.item?.name || `Item #${line.item_id}`,
      ordered_quantity: Number(line.ordered_quantity || 0),
      received_quantity_current: Number(line.received_quantity || 0),
      received_quantity: ''
    })));
  };

  const handleReceive = async (event) => {
    event.preventDefault();
    const invalid = receiveForm.find((line) => {
      const remaining = line.ordered_quantity - line.received_quantity_current;
      return Number(line.received_quantity || 0) > remaining;
    });
    if (invalid) { toast.error(`Received quantity exceeds remaining for ${invalid.item_name}`); return; }

    const items = receiveForm
      .filter((line) => Number(line.received_quantity) > 0)
      .map((line) => ({ purchase_order_item_id: line.purchase_order_item_id, received_quantity: Number(line.received_quantity) }));
    if (!items.length) { toast.error('Enter at least one received quantity'); return; }

    setReceiveSaving(true);
    try {
      await inventoryStores.purchaseOrders.receive(receiveModal.id, { received_date: todayIsoDate(), items });
      toast.success('Stock received');
      setReceiveModal(null);
      inventoryStores.purchaseOrders.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to receive');
    } finally {
      setReceiveSaving(false);
    }
  };

  const openEdit = (order) => {
    setEditModal(order);
    setEditForm({
      expected_delivery_date: order.expected_delivery_date || '',
      discount_amount: order.discount_amount ?? 0,
      tax_amount: order.tax_amount ?? 0,
      notes: order.notes || ''
    });
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    setEditSaving(true);
    try {
      await inventoryStores.purchaseOrders.update(editModal.id, {
        ...editForm,
        expected_delivery_date: editForm.expected_delivery_date || null,
        discount_amount: Number(editForm.discount_amount) || 0,
        tax_amount: Number(editForm.tax_amount) || 0
      });
      toast.success('Purchase order updated');
      setEditModal(null);
      inventoryStores.purchaseOrders.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to update order');
    } finally {
      setEditSaving(false);
    }
  };

  const supplierOptions = (supState.rows || []).filter((s) => s.status !== 'inactive').map((s) => ({ value: s.id, label: s.name }));
  const itemRows = (itemState.rows || []).filter((i) => i.status !== 'inactive');
  const itemOptions = itemRows.map((i) => ({ value: i.id, label: `${i.name} (${i.sku || 'no SKU'})` }));
  const can = (permission) => user?.role?.code === 'admin' || (user?.permissions || []).includes(permission);

  const [statusFilter, setStatusFilter] = useState('');

  const pipelineStages = useMemo(() => [
    { key: 'draft', label: 'Draft', color: 'var(--text-muted)', count: rows.filter((r) => r.status === 'draft').length },
    { key: 'pending', label: 'Pending', color: 'var(--accent-orange)', count: rows.filter((r) => r.status === 'pending').length },
    { key: 'partially_received', label: 'Partial', color: 'var(--accent-blue)', count: rows.filter((r) => r.status === 'partially_received').length },
    { key: 'received', label: 'Received', color: 'var(--accent-green)', count: rows.filter((r) => r.status === 'received').length },
    { key: 'cancelled', label: 'Cancelled', color: 'var(--accent-red)', count: rows.filter((r) => r.status === 'cancelled').length }
  ], [rows]);

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  return (
    <>
      {/* Pipeline */}
      <StatusPipeline stages={pipelineStages} active={statusFilter} onChange={setStatusFilter} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search orders..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} onChange={(e) => inventoryStores.purchaseOrders.load({ search: e.target.value, page: 1 })} />
        </div>
        <div style={{ marginLeft: 'auto' }}>{can('purchase_orders.create') && <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openCreate}><Plus size={16} /> Create Order</button>}</div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card" style={{ padding: '24px', aspectRatio: '1' }}><div style={{ height: '16px', width: '50%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div>)}</div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load'}</p><button onClick={() => inventoryStores.purchaseOrders.load()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button></div>
      ) : pagination.items.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><ShoppingCart size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-muted)' }}>{filteredRows.length === 0 && rows.length > 0 ? 'No orders match the filter' : 'No purchase orders found'}</p></div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {pagination.items.map((po, idx) => {
              const statusGradient = { draft: 'rgba(100,100,100,0.08)', pending: 'rgba(245,158,11,0.08)', partially_received: 'rgba(59,130,246,0.08)', received: 'rgba(16,185,129,0.08)', cancelled: 'rgba(239,68,68,0.08)' };
              return (
                <motion.div key={po.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03, duration: 0.25 }} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', aspectRatio: '1' }}>
                  <div style={{ padding: '18px 20px 14px', background: `linear-gradient(135deg, ${statusGradient[po.status] || statusGradient.draft} 0%, rgba(59,130,246,0.03) 100%)`, borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700' }}>{po.po_number}</span>
                      <StatusBadge status={po.status} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{po.supplier?.name || '—'}</div>
                  </div>
                  <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', textAlign: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</div>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--accent-green)' }}>${Number(po.total_amount || 0).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <InfoCell icon={Calendar} label="Date" value={po.order_date || '—'} />
                        <InfoCell icon={DollarSign} label="Items" value={`${po.items?.length || 0} lines`} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <CardAction icon={Eye} label="View" onClick={() => openDetail(po)} color="var(--text-secondary)" />
                      {can('purchase_orders.update') && !['received', 'cancelled'].includes(po.status) && <CardAction icon={Edit} label="Edit" onClick={() => openEdit(po)} color="var(--accent-blue)" />}
                      {can('purchase_orders.receive') && ['draft', 'pending', 'partially_received'].includes(po.status) && <CardAction icon={CheckCircle} label="Receive" onClick={() => openReceive(po)} color="var(--accent-green)" />}
                      {can('purchase_orders.cancel') && ['draft', 'pending'].includes(po.status) && <CardAction icon={XCircle} label="Cancel" onClick={() => setConfirmCancel(po)} color="var(--accent-red)" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && !error && filteredRows.length > 0 && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="orders" />}

      <Modal open={formOpen} title="Create Purchase Order" onClose={() => setFormOpen(false)} width="640px">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Supplier" required>
              <FormSelect value={draft.supplier_id} onChange={(v) => setDraft({ ...draft, supplier_id: v })} options={supplierOptions} placeholder="Select supplier" />
            </FormField>
            <FormField label="Order Date">
              <FormInput type="date" value={draft.order_date} onChange={(v) => setDraft({ ...draft, order_date: v })} />
            </FormField>
          </div>
          <FormField label="Expected Delivery">
            <FormInput type="date" value={draft.expected_delivery_date || ''} onChange={(v) => setDraft({ ...draft, expected_delivery_date: v || null })} />
          </FormField>

          <LineItems draft={draft} itemOptions={itemOptions} items={itemRows} addLineItem={addLineItem} updateLineItem={updateLineItem} updateLineItemValues={updateLineItemValues} removeLineItem={removeLineItem} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <FormField label="Discount">
              <FormInput type="number" value={draft.discount_amount} onChange={(v) => setDraft({ ...draft, discount_amount: v })} min="0" step="0.01" />
            </FormField>
            <FormField label="Tax">
              <FormInput type="number" value={draft.tax_amount} onChange={(v) => setDraft({ ...draft, tax_amount: v })} min="0" step="0.01" />
            </FormField>
            <FormField label="Total">
              <div style={{ padding: '12px 16px', background: 'var(--surface-subtle)', borderRadius: '12px', fontSize: '16px', fontWeight: '600', color: 'var(--accent-green)' }}>
                ${totals.total_amount.toFixed(2)}
              </div>
            </FormField>
          </div>

          <FormField label="Notes">
            <FormTextarea value={draft.notes} onChange={(v) => setDraft({ ...draft, notes: v })} placeholder="Optional notes" rows={2} />
          </FormField>
          <SubmitButton loading={saving}>Create Order</SubmitButton>
        </form>
      </Modal>

      <Modal open={!!detail} title={`Purchase Order ${detail?.po_number || ''}`} onClose={() => setDetail(null)} width="720px">
        {detail && <PurchaseOrderDetail order={detail} />}
      </Modal>

      <Modal open={!!editModal} title={`Edit ${editModal?.po_number || ''}`} onClose={() => setEditModal(null)} width="480px">
        <form onSubmit={handleEdit}>
          <FormField label="Expected Delivery">
            <FormInput type="date" value={editForm.expected_delivery_date} onChange={(v) => setEditForm({ ...editForm, expected_delivery_date: v })} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Discount">
              <FormInput type="number" value={editForm.discount_amount} onChange={(v) => setEditForm({ ...editForm, discount_amount: v })} min="0" step="0.01" />
            </FormField>
            <FormField label="Tax">
              <FormInput type="number" value={editForm.tax_amount} onChange={(v) => setEditForm({ ...editForm, tax_amount: v })} min="0" step="0.01" />
            </FormField>
          </div>
          <FormField label="Notes">
            <FormTextarea value={editForm.notes} onChange={(v) => setEditForm({ ...editForm, notes: v })} rows={2} />
          </FormField>
          <SubmitButton loading={editSaving}>Update Order</SubmitButton>
        </form>
      </Modal>

      <Modal open={!!receiveModal} title={`Receive ${receiveModal?.po_number || ''}`} onClose={() => setReceiveModal(null)} width="560px">
        <form onSubmit={handleReceive}>
          {receiveForm.map((line, idx) => {
            const remaining = line.ordered_quantity - line.received_quantity_current;
            return (
              <div key={line.purchase_order_item_id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px' }}>
                  <div>{line.item_name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Ordered {line.ordered_quantity}, received {line.received_quantity_current}, remaining {remaining}</div>
                </div>
                <FormInput type="number" value={receiveForm[idx]?.received_quantity} onChange={(v) => { const next = [...receiveForm]; next[idx] = { ...next[idx], received_quantity: v }; setReceiveForm(next); }} placeholder="0" min="0" max={remaining} step="0.01" />
              </div>
            );
          })}
          <SubmitButton loading={receiveSaving}>Confirm Receive</SubmitButton>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmCancel}
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${confirmCancel?.po_number}? This action cannot be undone.`}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(null)}
      />
    </>
  );
}

function LineItems({ draft, itemOptions, addLineItem, updateLineItem, updateLineItemValues, removeLineItem }) {
  return (
    <>
      <div style={{ marginTop: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Line Items</span>
        <button type="button" onClick={addLineItem} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>+ Add Item</button>
      </div>
      {draft.items.map((item, idx) => (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
          <FormField label={idx === 0 ? 'Item' : undefined}>
            <FormSelect value={item.item_id} onChange={(v) => updateLineItemValues(idx, { item_id: v })} options={itemOptions} placeholder="Select item or carton" />
          </FormField>
          <FormField label={idx === 0 ? 'Qty' : undefined}>
            <FormInput type="number" value={item.ordered_quantity} onChange={(v) => updateLineItem(idx, 'ordered_quantity', v)} placeholder="0" min="1" />
          </FormField>
          <FormField label={idx === 0 ? 'Unit Cost' : undefined}>
            <FormInput type="number" value={item.unit_cost} onChange={(v) => updateLineItem(idx, 'unit_cost', v)} placeholder="0.00" min="0" step="0.01" />
          </FormField>
          <button type="button" onClick={() => removeLineItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '8px', marginBottom: '16px' }}>x</button>
        </div>
      ))}
    </>
  );
}

function PurchaseOrderDetail({ order }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <Info label="Supplier" value={order.supplier?.name || '-'} />
        <Info label="Status" value={<StatusBadge status={order.status} />} />
        <Info label="Order Date" value={order.order_date || '-'} />
        <Info label="Expected" value={order.expected_delivery_date || '-'} />
        <Info label="Total" value={`$${Number(order.total_amount || 0).toFixed(2)}`} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Item', 'Ordered', 'Received', 'Remaining', 'Unit Cost'].map((head) => (
                <th key={head} style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', borderBottom: '1px solid var(--glass-border)' }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((line) => (
              <tr key={line.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.item?.name || `Item #${line.item_id}`}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.ordered_quantity}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.received_quantity}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{Number(line.ordered_quantity || 0) - Number(line.received_quantity || 0)}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>${Number(line.unit_cost || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {order.notes && <Info label="Notes" value={order.notes} />}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '14px' }}>{value}</div>
    </div>
  );
}

function InfoCell({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={12} color="var(--text-muted)" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}

function CardAction({ icon: Icon, label, onClick, color }) {
  return (
    <button onClick={onClick} title={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color, padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '500', transition: 'all 0.2s' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <Icon size={13} /><span>{label}</span>
    </button>
  );
}
