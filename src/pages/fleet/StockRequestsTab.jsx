import React, { useEffect, useState, useMemo } from 'react';
import { Plus, CheckCircle, XCircle, Eye, Edit, Printer, Search, AlertCircle, RefreshCw, ClipboardList, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/DataTable.jsx';
import StatusPipeline from '../../components/StatusPipeline.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, FormTextarea, SubmitButton } from '../../components/FormField.jsx';
import { toast } from '../../components/Toast.jsx';
import { accountantStores, inventoryStores, authStore, settingsStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { createStockRequestDraft, calculateStockRequestTotals, REQUEST_TYPES, PAYMENT_METHODS, todayIsoDate } from '../../domain/index.js';
import { qzPrintService } from '../../services/qzPrintService.js';

const editableStatuses = ['draft', 'pending'];

const receiptLabel = (request) => {
  if (!request?.driver_received_at) return 'Receipt pending';
  if (request.driver_receipt_status === 'receipt_partial') return 'Partial receipt';
  if (request.driver_receipt_status === 'receipt_not_confirmed') return 'Not confirmed';
  return 'Receipt submitted';
};

const receiptColor = (request) => {
  if (!request?.driver_received_at) return 'var(--accent-orange)';
  if (request.driver_receipt_status === 'receipt_partial') return 'var(--accent-blue)';
  if (request.driver_receipt_status === 'receipt_not_confirmed') return 'var(--accent-red)';
  return 'var(--accent-green)';
};

const statusGradient = (status) => {
  switch (status) {
    case 'approved': return 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)';
    case 'completed': return 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)';
    case 'cancelled': return 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)';
    default: return 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)';
  }
};

export default function StockRequestsTab() {
  const { rows, meta, loading, error } = useStore(accountantStores.stockRequests);
  const driverState = useStore(accountantStores.drivers);
  const itemState = useStore(inventoryStores.items);
  const { user } = useStore(authStore);
  const { settings } = useStore(settingsStore);

  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(createStockRequestDraft());
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ notes: '', request_status: 'pending' });
  const [editSaving, setEditSaving] = useState(false);
  const [printModal, setPrintModal] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [printerName, setPrinterName] = useState('');
  const [printStatus, setPrintStatus] = useState('');
  const [completeModal, setCompleteModal] = useState(null);
  const [completePayment, setCompletePayment] = useState({ payment_amount: '', payment_method: 'cash', payment_date: todayIsoDate(), payment_notes: '' });
  const [completeSaving, setCompleteSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  useEffect(() => {
    accountantStores.stockRequests.load();
    accountantStores.drivers.load({ limit: 100 });
    inventoryStores.items.load();
    settingsStore.load().catch(() => {});
  }, []);

  useEffect(() => {
    setPrinterName(settings.qz_default_printer || '');
  }, [settings.qz_default_printer]);

  const can = (permission) => user?.role?.code === 'admin' || (user?.permissions || []).includes(permission);
  const canComplete = (row) => {
    if (row.request_status !== 'approved') return false;
    const mode = settings.accepted_request_fulfillment_mode || 'both';
    if (mode === 'print') return true;
    return row.driver_receipt_status === 'receipt_submitted';
  };
  const canCancel = (row) => !['completed', 'cancelled'].includes(row.request_status);
  const canAccept = (row) => ['draft', 'pending'].includes(row.request_status);
  const printEnabled = ['print', 'both'].includes(settings.accepted_request_fulfillment_mode || 'both') && settings.qz_tray_enabled !== 'false';
  const canPrint = (row) => printEnabled && ['approved', 'completed'].includes(row.request_status);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      accountantStores.stockRequests.load({ search: value, page: 1 });
    }, 300));
  };

  const goToPage = (page) => accountantStores.stockRequests.load({ page });
  const { page = 1, pages = 1, total = 0 } = meta;

  // Pipeline stages
  const pipelineStages = useMemo(() => [
    { key: 'draft', label: 'Draft', color: 'var(--text-muted)', count: rows.filter((r) => r.request_status === 'draft').length },
    { key: 'pending', label: 'Pending', color: 'var(--accent-orange)', count: rows.filter((r) => r.request_status === 'pending').length },
    { key: 'approved', label: 'Approved', color: 'var(--accent-blue)', count: rows.filter((r) => r.request_status === 'approved').length },
    { key: 'completed', label: 'Completed', color: 'var(--accent-green)', count: rows.filter((r) => r.request_status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', color: 'var(--accent-red)', count: rows.filter((r) => r.request_status === 'cancelled').length }
  ], [rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (pipelineFilter) result = result.filter((r) => r.request_status === pipelineFilter);
    if (typeFilter) result = result.filter((r) => r.request_type === typeFilter);
    if (paymentFilter) result = result.filter((r) => r.payment_status === paymentFilter);
    return result;
  }, [rows, pipelineFilter, typeFilter, paymentFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  const openCreate = () => { setDraft(createStockRequestDraft()); setFormOpen(true); };

  const addLineItem = () => { setDraft({ ...draft, items: [...draft.items, { item_id: '', quantity: '', unit_price: '' }] }); };
  const updateLineItem = (idx, field, value) => { const items = [...draft.items]; items[idx] = { ...items[idx], [field]: value }; setDraft({ ...draft, items }); };
  const updateLineItemValues = (idx, values) => { const items = [...draft.items]; items[idx] = { ...items[idx], ...values }; setDraft({ ...draft, items }); };
  const removeLineItem = (idx) => { setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) }); };
  const totals = calculateStockRequestTotals(draft);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.driver_id) { toast.error('Please select a driver'); return; }
    if (!draft.items.length) { toast.error('Add at least one line item'); return; }
    for (const item of draft.items) {
      if (!item.item_id || !item.quantity || Number(item.quantity) <= 0) { toast.error('All line items must have an item and valid quantity'); return; }
    }
    setSaving(true);
    try {
      const payload = { ...draft, ...totals, items: draft.items.map((i) => ({ item_id: Number(i.item_id), quantity: Number(i.quantity), unit_price: Number(i.unit_price) || 0 })) };
      await accountantStores.stockRequests.create(payload);
      toast.success('Stock request created');
      setFormOpen(false);
      accountantStores.stockRequests.load();
    } catch (err) { toast.error(err?.message || 'Failed to create request'); }
    finally { setSaving(false); }
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmAction.type === 'accept') { await accountantStores.stockRequests.accept(confirmAction.row.id); toast.success('Request accepted'); }
      else { await accountantStores.stockRequests.cancel(confirmAction.row.id); toast.success('Request cancelled'); }
      accountantStores.stockRequests.load();
    } catch (err) { toast.error(err?.message || 'Action failed'); }
    setConfirmAction(null);
  };

  const openDetail = async (row) => {
    try { const result = await accountantStores.stockRequests.loadOne(row.id); setDetail(result.data || row); }
    catch (err) { toast.error(err?.message || 'Failed to load request'); }
  };

  const openEdit = (row) => { setEditModal(row); setEditForm({ notes: row.notes || '', request_status: row.request_status || 'pending' }); };

  const openPrint = async (row) => {
    try { const result = await accountantStores.stockRequests.loadOne(row.id); setPrintModal(result.data || row); setPrintStatus(''); }
    catch (err) { toast.error(err?.message || 'Failed to load printable order'); }
  };

  const openComplete = (row) => {
    setCompleteModal(row);
    setCompletePayment({ payment_amount: row.request_type === 'stock_return' ? '0' : row.remaining_amount || '', payment_method: 'cash', payment_date: todayIsoDate(), payment_notes: '' });
  };

  const handleComplete = async (event) => {
    event.preventDefault();
    if (!completeModal) return;
    const isReturn = completeModal.request_type === 'stock_return';
    const amount = isReturn ? 0 : Number(completePayment.payment_amount || 0);
    if (amount < 0) { toast.error('Payment cannot be negative'); return; }
    if (amount > Number(completeModal.remaining_amount || 0)) { toast.error('Payment exceeds remaining balance'); return; }
    setCompleteSaving(true);
    try {
      await accountantStores.stockRequests.complete(completeModal.id, { ...completePayment, payment_amount: amount });
      toast.success(isReturn ? 'Return completed and credited' : amount > 0 ? 'Request completed and payment recorded' : 'Request completed with missing payment');
      setCompleteModal(null); accountantStores.stockRequests.load(); accountantStores.payments.load().catch(() => {});
    } catch (err) { toast.error(err?.message || 'Failed to complete request'); }
    finally { setCompleteSaving(false); }
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    setEditSaving(true);
    try { await accountantStores.stockRequests.update(editModal.id, editForm); toast.success('Stock request updated'); setEditModal(null); accountantStores.stockRequests.load(); }
    catch (err) { toast.error(err?.message || 'Failed to update request'); }
    finally { setEditSaving(false); }
  };

  const handlePrint = async () => {
    if (!printModal) return;
    setPrinting(true); setPrintStatus('Connecting to QZ Tray...');
    try {
      const result = await qzPrintService.printRequest({ request: printModal, printerName });
      await accountantStores.stockRequests.print(printModal.id, { printer_name: result.printer, qz_version: result.qzVersion, status: 'success' });
      setPrintStatus(`Printed on ${result.printer}`); toast.success('Order printed');
    } catch (err) {
      await accountantStores.stockRequests.print(printModal.id, { printer_name: printerName, status: 'failed', error_message: err?.message || 'Print failed' }).catch(() => {});
      setPrintStatus(err?.message || 'Print failed'); toast.error(err?.message || 'Print failed');
    } finally { setPrinting(false); }
  };

  const driverOptions = (driverState.rows || [])
    .filter((driver) => driver.status === 'active')
    .map((driver) => ({ value: driver.id, label: driver.full_name }));
  const itemRows = (itemState.rows || []).filter((i) => i.status !== 'inactive');
  const itemOptions = itemRows.map((i) => ({ value: i.id, label: `${i.name} (${i.sku || i.barcode || 'no code'}) | avail ${Number(i.available_stock ?? (i.current_stock || 0))}`, item: i }));

  return (
    <>
      {/* Pipeline */}
      <StatusPipeline stages={pipelineStages} active={pipelineFilter} onChange={setPipelineFilter} />

      {/* Filters */}
      <FilterBar
        filters={[
          { key: 'type', label: 'Type', value: typeFilter, options: [{ value: 'stock_out', label: 'Stock Out' }, { value: 'stock_return', label: 'Stock Return' }] },
          { key: 'payment', label: 'Payment', value: paymentFilter, options: [{ value: 'pending', label: 'Unpaid' }, { value: 'partially_paid', label: 'Partial' }, { value: 'paid', label: 'Paid' }] }
        ]}
        onChange={(key, value) => { if (key === 'type') setTypeFilter(value); if (key === 'payment') setPaymentFilter(value); }}
        onClear={() => { setTypeFilter(''); setPaymentFilter(''); }}
      />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search requests..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {can('stock_requests.create') && (
            <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openCreate}>
              <Plus size={16} /> Create Request
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', aspectRatio: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div><div style={{ height: '16px', width: '50%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite', marginBottom: '12px' }} /><div style={{ height: '12px', width: '70%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div>
              <div style={{ height: '12px', width: '40%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load requests'}</p>
          <button onClick={() => accountantStores.stockRequests.load()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <ClipboardList size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No stock requests found</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <ClipboardList size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No requests match the current filters</p>
        </div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {pagination.items.map((req, idx) => (
              <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03, duration: 0.25 }} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', aspectRatio: '1' }}>
                {/* Header */}
                <div style={{ padding: '18px 20px 14px', background: statusGradient(req.request_status), borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{req.request_number}</span>
                    <StatusBadge status={req.request_status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <StatusBadge status={req.request_type} />
                    <ReceiptBadge request={req} />
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <InfoCell icon={ClipboardList} label="Driver" value={req.driver?.full_name || '-'} />
                      <InfoCell icon={Calendar} label="Date" value={req.request_date || '-'} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <MoneyCell label="Total" value={req.total_amount} color="var(--text-primary)" />
                      <MoneyCell label="Remaining" value={req.remaining_amount} color={Number(req.remaining_amount || 0) > 0 ? 'var(--accent-orange)' : 'var(--accent-green)'} />
                    </div>
                    <div style={{ marginBottom: '14px' }}><StatusBadge status={req.payment_status} /></div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <CardAction icon={Eye} label="View" onClick={() => openDetail(req)} color="var(--text-secondary)" />
                    {can('stock_requests.update') && editableStatuses.includes(req.request_status) && <CardAction icon={Edit} label="Edit" onClick={() => openEdit(req)} color="var(--accent-blue)" />}
                    {can('stock_requests.accept') && canAccept(req) && <CardAction icon={CheckCircle} label="Accept" onClick={() => setConfirmAction({ type: 'accept', row: req })} color="var(--accent-blue)" />}
                    {can('stock_requests.complete') && canComplete(req) && <CardAction icon={CheckCircle} label="Complete" onClick={() => openComplete(req)} color="var(--accent-green)" />}
                    {can('stock_requests.print') && canPrint(req) && <CardAction icon={Printer} label="Print" onClick={() => openPrint(req)} color="var(--accent-orange)" />}
                    {can('stock_requests.cancel') && canCancel(req) && <CardAction icon={XCircle} label="Cancel" onClick={() => setConfirmAction({ type: 'cancel', row: req })} color="var(--accent-red)" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredRows.length > 0 && (
        <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="requests" />
      )}

      {/* Create Modal */}
      <Modal open={formOpen} title="Create Stock Request" onClose={() => setFormOpen(false)} width="620px">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <FormField label="Driver" required><FormSelect value={draft.driver_id} onChange={(v) => setDraft({ ...draft, driver_id: v })} options={driverOptions} placeholder="Select driver" /></FormField>
            <FormField label="Type"><FormSelect value={draft.request_type} onChange={(v) => setDraft({ ...draft, request_type: v })} options={REQUEST_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} /></FormField>
            <FormField label="Date"><FormInput type="date" value={draft.request_date} onChange={(v) => setDraft({ ...draft, request_date: v })} /></FormField>
          </div>
          <LineItems draft={draft} itemOptions={itemOptions} addLineItem={addLineItem} updateLineItem={updateLineItem} updateLineItemValues={updateLineItemValues} removeLineItem={removeLineItem} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <FormField label="Discount"><FormInput type="number" value={draft.discount_amount} onChange={(v) => setDraft({ ...draft, discount_amount: v })} min="0" step="0.01" /></FormField>
            <FormField label="Total"><div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '16px', fontWeight: '600', color: 'var(--accent-green)' }}>${totals.total_amount.toFixed(2)}</div></FormField>
          </div>
          <FormField label="Notes"><FormTextarea value={draft.notes} onChange={(v) => setDraft({ ...draft, notes: v })} placeholder="Optional notes" rows={2} /></FormField>
          <SubmitButton loading={saving}>Create Request</SubmitButton>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detail} title={`Stock Request ${detail?.request_number || ''}`} onClose={() => setDetail(null)} width="720px">
        {detail && <StockRequestDetail request={detail} />}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} title={`Edit ${editModal?.request_number || ''}`} onClose={() => setEditModal(null)} width="480px">
        <form onSubmit={handleEdit}>
          <FormField label="Request Status"><FormSelect value={editForm.request_status} onChange={(v) => setEditForm({ ...editForm, request_status: v })} options={editableStatuses.map((s) => ({ value: s, label: s }))} /></FormField>
          <FormField label="Notes"><FormTextarea value={editForm.notes} onChange={(v) => setEditForm({ ...editForm, notes: v })} rows={3} /></FormField>
          <SubmitButton loading={editSaving}>Update Request</SubmitButton>
        </form>
      </Modal>

      {/* Confirm Action */}
      <ConfirmModal open={!!confirmAction} title={confirmAction?.type === 'accept' ? 'Accept Request' : 'Cancel Request'} message={`Are you sure you want to ${confirmAction?.type} request ${confirmAction?.row?.request_number}?`} onConfirm={handleConfirmAction} onCancel={() => setConfirmAction(null)} />

      {/* Complete Modal */}
      <Modal open={!!completeModal} title={`Complete ${completeModal?.request_number || ''}`} onClose={() => setCompleteModal(null)} width="520px">
        <form onSubmit={handleComplete}>
          <div style={{ padding: '12px 14px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>Total: <strong style={{ color: 'var(--text-primary)' }}>${Number(completeModal?.total_amount || 0).toFixed(2)}</strong></div>
            {completeModal?.request_type === 'stock_return' ? (
              <div>Driver credit: <strong style={{ color: 'var(--accent-green)' }}>${Number(completeModal?.total_amount || 0).toFixed(2)}</strong></div>
            ) : (
              <>
                <div>Already paid: <strong style={{ color: 'var(--text-primary)' }}>${Number(completeModal?.paid_amount || 0).toFixed(2)}</strong></div>
                <div>Remaining: <strong style={{ color: 'var(--accent-orange)' }}>${Number(completeModal?.remaining_amount || 0).toFixed(2)}</strong></div>
              </>
            )}
          </div>
          {completeModal?.request_type !== 'stock_return' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Payment Amount"><FormInput type="number" value={completePayment.payment_amount} onChange={(v) => setCompletePayment({ ...completePayment, payment_amount: v })} placeholder="0.00" min="0" max={completeModal?.remaining_amount} step="0.01" /></FormField>
                <FormField label="Method"><FormSelect value={completePayment.payment_method} onChange={(v) => setCompletePayment({ ...completePayment, payment_method: v })} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace(/_/g, ' ') }))} /></FormField>
              </div>
              <FormField label="Payment Date"><FormInput type="date" value={completePayment.payment_date} onChange={(v) => setCompletePayment({ ...completePayment, payment_date: v })} /></FormField>
              <FormField label="Payment Notes"><FormTextarea value={completePayment.payment_notes} onChange={(v) => setCompletePayment({ ...completePayment, payment_notes: v })} placeholder="Optional notes" rows={2} /></FormField>
              {Number(completePayment.payment_amount || 0) < Number(completeModal?.remaining_amount || 0) && (
                <div style={{ padding: '10px 12px', marginBottom: '16px', borderRadius: '10px', background: 'color-mix(in srgb, var(--accent-orange) 12%, transparent)', color: 'var(--accent-orange)', fontSize: '13px' }}>The unpaid balance will remain open and appear in missing payments reports.</div>
              )}
            </>
          )}
          <SubmitButton loading={completeSaving}>Complete Request</SubmitButton>
        </form>
      </Modal>

      {/* Print Modal */}
      <Modal open={!!printModal} title={`Print ${printModal?.request_number || ''}`} onClose={() => setPrintModal(null)} width="520px">
        <FormField label="Printer Name"><FormInput value={printerName} onChange={setPrinterName} placeholder="Leave empty for default printer" /></FormField>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>QZ Tray will verify the local print service and use signed backend requests before printing.</div>
        {printStatus && <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>{printStatus}</div>}
        <button className="glass-button" disabled={printing} onClick={handlePrint} style={{ width: '100%' }}><Printer size={16} /> {printing ? 'Printing...' : 'Print Order'}</button>
      </Modal>
    </>
  );
}

function InfoCell({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color="var(--text-muted)" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}

function MoneyCell({ label, value, color }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: '700', color }}>${Number(value || 0).toFixed(2)}</div>
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

function ReceiptBadge({ request }) {
  const color = receiptColor(request);
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `color-mix(in srgb, ${color} 15%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
      {receiptLabel(request)}
    </span>
  );
}

function LineItems({ draft, itemOptions, addLineItem, updateLineItem, updateLineItemValues, removeLineItem }) {
  const [code, setCode] = useState('');
  const lookupCode = async () => {
    if (!code.trim()) return;
    try {
      const result = await inventoryStores.items.lookup(code.trim());
      const item = result.data;
      const index = draft.items.findIndex((line) => !line.item_id);
      const targetIndex = index >= 0 ? index : draft.items.length;
      if (index < 0) addLineItem();
      setTimeout(() => updateLineItemValues(targetIndex, { item_id: item.id, unit_price: item.selling_price || 0, quantity: draft.items[targetIndex]?.quantity || 1 }), 0);
      setCode('');
    } catch (error) {
      toast.error(error?.message || 'Code not found');
    }
  };
  return (
    <>
      <div style={{ marginTop: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Line Items</span>
        <button type="button" onClick={addLineItem} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>+ Add Item</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <FormInput value={code} onChange={setCode} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); lookupCode(); } }} placeholder="Scan or enter SKU/barcode" />
        <button type="button" onClick={lookupCode} className="glass-button" style={{ padding: '8px 12px' }}>Add</button>
      </div>
      {draft.items.map((item, idx) => (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
          <FormField label={idx === 0 ? 'Item' : undefined}><FormSelect value={item.item_id} onChange={(v) => updateLineItemValues(idx, { item_id: v })} options={itemOptions} placeholder="Select item" /></FormField>
          <FormField label={idx === 0 ? 'Qty' : undefined}><FormInput type="number" value={item.quantity} onChange={(v) => updateLineItem(idx, 'quantity', v)} placeholder="0" min="1" /></FormField>
          <FormField label={idx === 0 ? 'Unit Price' : undefined}><FormInput type="number" value={item.unit_price} onChange={(v) => updateLineItem(idx, 'unit_price', v)} placeholder="0.00" min="0" step="0.01" /></FormField>
          <button type="button" onClick={() => removeLineItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '8px', marginBottom: '16px' }}>x</button>
        </div>
      ))}
    </>
  );
}

function StockRequestDetail({ request }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <DetailInfo label="Driver" value={request.driver?.full_name || '-'} />
        <DetailInfo label="Request Status" value={<StatusBadge status={request.request_status} />} />
        <DetailInfo label="Driver Receipt" value={<ReceiptBadge request={request} />} />
        <DetailInfo label="Payment Status" value={<StatusBadge status={request.payment_status} />} />
        <DetailInfo label="Total" value={`$${Number(request.total_amount || 0).toFixed(2)}`} />
        <DetailInfo label="Paid" value={`$${Number(request.paid_amount || 0).toFixed(2)}`} />
        <DetailInfo label="Remaining" value={`$${Number(request.remaining_amount || 0).toFixed(2)}`} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Item', 'Qty', 'Driver Confirmed', 'Unit Price', 'Total'].map((h) => (<th key={h} style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>))}</tr></thead>
          <tbody>
            {(request.items || []).map((line) => (
              <tr key={line.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.item?.name || `Item #${line.item_id}`}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.quantity}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.confirmation ? (line.confirmation.confirmed ? 'Yes' : 'No') : '-'}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>${Number(line.unit_price || 0).toFixed(2)}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>${(Number(line.quantity || 0) * Number(line.unit_price || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {request.notes && <DetailInfo label="Notes" value={request.notes} />}
    </div>
  );
}

function DetailInfo({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '14px' }}>{value}</div>
    </div>
  );
}
