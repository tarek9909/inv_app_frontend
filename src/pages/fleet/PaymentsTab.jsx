import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, AlertCircle, RefreshCw, CreditCard, Calendar, DollarSign, Hash, Eye, User, Package, FileText, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/DataTable.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, FormTextarea, SubmitButton } from '../../components/FormField.jsx';
import { toast } from '../../components/Toast.jsx';
import { accountantStores, authStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { PAYMENT_METHODS, todayIsoDate } from '../../domain/index.js';

const money = (v) => `$${Number(v || 0).toFixed(2)}`;
const methodColor = (method) => {
  switch (method) {
    case 'cash': return 'var(--accent-green)';
    case 'bank_transfer': return 'var(--accent-blue)';
    default: return 'var(--accent-purple)';
  }
};

export default function PaymentsTab() {
  const { rows, meta, loading, error } = useStore(accountantStores.payments);
  const requestState = useStore(accountantStores.stockRequests);
  const { user } = useStore(authStore);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [form, setForm] = useState({ stock_request_id: '', amount: '', payment_method: 'cash', payment_date: todayIsoDate(), notes: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [methodFilter, setMethodFilter] = useState('');

  useEffect(() => {
    accountantStores.payments.load();
    accountantStores.stockRequests.load({ limit: 200 });
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => { accountantStores.payments.load({ search: value, page: 1 }); }, 300));
  };

  const filteredRows = useMemo(() => {
    if (!methodFilter) return rows;
    return rows.filter((p) => p.payment_method === methodFilter);
  }, [rows, methodFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  // Summary calculations
  const summary = useMemo(() => {
    const total = filteredRows.reduce((s, p) => s + Number(p.amount || 0), 0);
    const cash = filteredRows.filter((p) => p.payment_method === 'cash').reduce((s, p) => s + Number(p.amount || 0), 0);
    const bank = filteredRows.filter((p) => p.payment_method === 'bank_transfer').reduce((s, p) => s + Number(p.amount || 0), 0);
    const other = total - cash - bank;
    return { total, cash, bank, other, count: filteredRows.length };
  }, [filteredRows]);

  // Driver detail data
  const driverReport = useMemo(() => {
    if (!detailModal) return null;
    const driverName = detailModal.stock_request?.driver?.full_name || detailModal.driver?.full_name || 'Unknown';
    const driverId = detailModal.stock_request?.driver_id || detailModal.driver_id;
    const driverPayments = rows.filter((p) => (p.stock_request?.driver_id || p.driver_id) === driverId);
    const driverRequests = (requestState.rows || []).filter((r) => r.driver_id === driverId && r.request_status !== 'cancelled');
    const totalRevenue = driverRequests.filter((r) => r.request_type === 'stock_out').reduce((s, r) => s + Number(r.total_amount || 0), 0);
    const totalPaid = driverPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalRemaining = driverRequests.filter((r) => r.request_type === 'stock_out').reduce((s, r) => s + Number(r.remaining_amount || 0), 0);
    const completedOrders = driverRequests.filter((r) => r.request_status === 'completed').length;
    return { driverName, driverId, driverPayments, driverRequests, totalRevenue, totalPaid, totalRemaining, completedOrders };
  }, [detailModal, rows, requestState.rows]);

  const openCreate = () => { setForm({ stock_request_id: '', amount: '', payment_method: 'cash', payment_date: todayIsoDate(), notes: '' }); setModalOpen(true); };
  const payableRequests = (requestState.rows || []).filter((r) => r.payment_status !== 'cancelled' && Number(r.remaining_amount || 0) > 0);
  const selectedRequest = payableRequests.find((r) => String(r.id) === String(form.stock_request_id));
  const requestOptions = payableRequests.map((r) => ({ value: r.id, label: `${r.request_number} - ${r.driver?.full_name || 'Unknown'} (${money(r.remaining_amount)} due)` }));
  const canCreatePayment = user?.role?.code === 'admin' || (user?.permissions || []).includes('payments.create');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.stock_request_id) { toast.error('Please select a stock request'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Amount must be greater than 0'); return; }
    setSaving(true);
    try {
      await accountantStores.payments.create({ ...form, amount: Number(form.amount) });
      toast.success('Payment recorded');
      setModalOpen(false);
      accountantStores.payments.load();
      accountantStores.stockRequests.load({ limit: 200 });
    } catch (err) { toast.error(err?.message || 'Failed to record payment'); }
    finally { setSaving(false); }
  };

  return (
    <>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <SummaryCard icon={DollarSign} label="Total Collected" value={money(summary.total)} color="var(--accent-blue)" />
        <SummaryCard icon={CreditCard} label="Cash" value={money(summary.cash)} color="var(--accent-green)" />
        <SummaryCard icon={CreditCard} label="Bank Transfer" value={money(summary.bank)} color="var(--accent-blue)" />
        <SummaryCard icon={TrendingUp} label="Transactions" value={summary.count} color="var(--accent-purple)" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search payments..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} />
        </div>
        {canCreatePayment && (
          <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px', marginLeft: 'auto' }} onClick={openCreate}>
            <Plus size={16} /> Record Payment
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        filters={[{ key: 'method', label: 'Method', value: methodFilter, options: [{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'other', label: 'Other' }] }]}
        onChange={(key, value) => setMethodFilter(value)}
        onClear={() => setMethodFilter('')}
      />

      {/* Payment Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', height: '160px' }}>
              <div style={{ height: '14px', width: '50%', borderRadius: '4px', background: 'var(--surface-subtle)', animation: 'pulse 1.5s infinite', marginBottom: '12px' }} />
              <div style={{ height: '12px', width: '70%', borderRadius: '4px', background: 'var(--surface-subtle)', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load payments'}</p>
          <button onClick={() => accountantStores.payments.load()} className="refresh-btn" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <CreditCard size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No payments found</p>
        </div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          <AnimatePresence>
            {pagination.items.map((payment, idx) => (
              <motion.div key={payment.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.02 }}
                className="glass-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setDetailModal(payment)}
              >
                <div style={{ display: 'flex', height: '100%' }}>
                  {/* Left color accent */}
                  <div style={{ width: '4px', background: methodColor(payment.payment_method), flexShrink: 0 }} />
                  {/* Content */}
                  <div style={{ flex: 1, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    {/* Left: stacked date + method */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</div>
                      <StatusBadge status={payment.payment_method} colorMap={{ cash: 'var(--accent-green)', bank_transfer: 'var(--accent-blue)', other: 'var(--accent-purple)' }} />
                    </div>
                    {/* Center: driver + request */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{payment.stock_request?.driver?.full_name || payment.driver?.full_name || '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{payment.stock_request?.request_number || payment.payment_number}</div>
                    </div>
                    {/* Right: amount */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: methodColor(payment.payment_method) }}>{money(payment.amount)}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredRows.length > 0 && (
        <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="payments" />
      )}

      {/* Driver Detail Modal */}
      <Modal open={!!detailModal} title="Payment & Driver Report" onClose={() => setDetailModal(null)} width="720px">
        {detailModal && driverReport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Payment Info */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment</div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{detailModal.payment_number}</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: methodColor(detailModal.payment_method) }}>{money(detailModal.amount)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <MiniInfo label="Date" value={detailModal.payment_date ? new Date(detailModal.payment_date).toLocaleDateString() : '-'} />
                <MiniInfo label="Method" value={<StatusBadge status={detailModal.payment_method} colorMap={{ cash: 'var(--accent-green)', bank_transfer: 'var(--accent-blue)', other: 'var(--accent-purple)' }} />} />
                <MiniInfo label="Request" value={detailModal.stock_request?.request_number || '-'} />
                {detailModal.notes && <MiniInfo label="Notes" value={detailModal.notes} />}
              </div>
            </div>

            {/* Driver Summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="var(--accent-blue)" /></div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{driverReport.driverName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Driver Performance Summary</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <MetricBox label="Total Revenue" value={money(driverReport.totalRevenue)} color="var(--accent-blue)" />
                <MetricBox label="Total Paid" value={money(driverReport.totalPaid)} color="var(--accent-green)" />
                <MetricBox label="Outstanding" value={money(driverReport.totalRemaining)} color="var(--accent-orange)" />
                <MetricBox label="Completed Orders" value={driverReport.completedOrders} color="var(--accent-purple)" />
              </div>
            </div>

            {/* Driver Invoices (Stock Requests) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <FileText size={14} color="var(--accent-purple)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Invoices / Stock Requests</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({driverReport.driverRequests.length})</span>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ background: 'var(--surface-subtle)' }}>
                    {['Request #', 'Date', 'Type', 'Status', 'Total', 'Paid', 'Remaining'].map((h) => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {driverReport.driverRequests.slice(0, 20).map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '7px 10px', fontWeight: '500' }}>{r.request_number}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>{r.request_date || '-'}</td>
                        <td style={{ padding: '7px 10px' }}><StatusBadge status={r.request_type} /></td>
                        <td style={{ padding: '7px 10px' }}><StatusBadge status={r.request_status} /></td>
                        <td style={{ padding: '7px 10px', fontWeight: '600' }}>{money(r.total_amount)}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--accent-green)' }}>{money(r.paid_amount)}</td>
                        <td style={{ padding: '7px 10px', color: Number(r.remaining_amount || 0) > 0 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>{money(r.remaining_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Driver Payments History */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CreditCard size={14} color="var(--accent-green)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Payment History</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({driverReport.driverPayments.length})</span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ background: 'var(--surface-subtle)' }}>
                    {['Payment #', 'Date', 'Method', 'Amount'].map((h) => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {driverReport.driverPayments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)', background: p.id === detailModal.id ? 'rgba(56, 189, 248, 0.06)' : 'transparent' }}>
                        <td style={{ padding: '7px 10px', fontWeight: '500' }}>{p.payment_number}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</td>
                        <td style={{ padding: '7px 10px' }}><StatusBadge status={p.payment_method} colorMap={{ cash: 'var(--accent-green)', bank_transfer: 'var(--accent-blue)', other: 'var(--accent-purple)' }} /></td>
                        <td style={{ padding: '7px 10px', fontWeight: '600', color: methodColor(p.payment_method) }}>{money(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={modalOpen} title="Record Payment" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <FormField label="Stock Request" required>
            <FormSelect value={form.stock_request_id} onChange={(v) => setForm({ ...form, stock_request_id: v, amount: '' })} options={requestOptions} placeholder="Select request" />
          </FormField>
          {selectedRequest && (
            <div style={{ padding: '12px 14px', marginBottom: '16px', background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Remaining balance: <strong style={{ color: 'var(--accent-orange)' }}>{money(selectedRequest.remaining_amount)}</strong>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Amount" required><FormInput type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="0.00" min="0.01" max={selectedRequest?.remaining_amount} step="0.01" /></FormField>
            <FormField label="Method"><FormSelect value={form.payment_method} onChange={(v) => setForm({ ...form, payment_method: v })} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace(/_/g, ' ') }))} /></FormField>
          </div>
          <FormField label="Payment Date"><FormInput type="date" value={form.payment_date} onChange={(v) => setForm({ ...form, payment_date: v })} /></FormField>
          <FormField label="Notes"><FormTextarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Optional notes" rows={2} /></FormField>
          <SubmitButton loading={saving}>Record Payment</SubmitButton>
        </form>
      </Modal>
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: '10px', background: `color-mix(in srgb, ${color} 5%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 15%, transparent)` }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: '700', color }}>{value}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
