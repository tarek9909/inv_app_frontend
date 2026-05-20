import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, AlertCircle, RefreshCw, CreditCard, Calendar, DollarSign, Hash } from 'lucide-react';
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

const methodColor = (method) => {
  switch (method) {
    case 'cash': return 'var(--accent-green)';
    case 'bank_transfer': return 'var(--accent-blue)';
    default: return 'var(--accent-purple)';
  }
};

const methodGradient = (method) => {
  switch (method) {
    case 'cash': return 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)';
    case 'bank_transfer': return 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)';
    default: return 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)';
  }
};

export default function PaymentsTab() {
  const { rows, meta, loading, error } = useStore(accountantStores.payments);
  const requestState = useStore(accountantStores.stockRequests);
  const { user } = useStore(authStore);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ stock_request_id: '', amount: '', payment_method: 'cash', payment_date: todayIsoDate(), notes: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [methodFilter, setMethodFilter] = useState('');

  useEffect(() => {
    accountantStores.payments.load();
    accountantStores.stockRequests.load({ limit: 100 });
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      accountantStores.payments.load({ search: value, page: 1 });
    }, 300));
  };

  const goToPage = (page) => accountantStores.payments.load({ page });
  const { page = 1, pages = 1, total = 0 } = meta;

  const filteredRows = useMemo(() => {
    if (!methodFilter) return rows;
    return rows.filter((p) => p.payment_method === methodFilter);
  }, [rows, methodFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  const openCreate = () => {
    setForm({ stock_request_id: '', amount: '', payment_method: 'cash', payment_date: todayIsoDate(), notes: '' });
    setModalOpen(true);
  };

  const payableRequests = (requestState.rows || []).filter((r) => r.payment_status !== 'cancelled' && Number(r.remaining_amount || 0) > 0);
  const selectedRequest = payableRequests.find((r) => String(r.id) === String(form.stock_request_id));
  const requestOptions = payableRequests.map((r) => ({
    value: r.id,
    label: `${r.request_number} - ${r.driver?.full_name || 'Unknown'} ($${Number(r.remaining_amount || 0).toFixed(2)} due)`
  }));
  const canCreatePayment = user?.role?.code === 'admin' || (user?.permissions || []).includes('payments.create');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.stock_request_id) { toast.error('Please select a stock request'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Amount must be greater than 0'); return; }
    if (selectedRequest && Number(form.amount) > Number(selectedRequest.remaining_amount || 0)) { toast.error('Amount exceeds remaining balance'); return; }
    setSaving(true);
    try {
      await accountantStores.payments.create({ ...form, amount: Number(form.amount) });
      toast.success('Payment recorded');
      setModalOpen(false);
      accountantStores.payments.load();
      accountantStores.stockRequests.load({ limit: 100 });
    } catch (err) { toast.error(err?.message || 'Failed to record payment'); }
    finally { setSaving(false); }
  };

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search payments..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          {canCreatePayment && (
            <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openCreate}>
              <Plus size={16} /> Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          { key: 'method', label: 'Method', value: methodFilter, options: [{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'other', label: 'Other' }] }
        ]}
        onChange={(key, value) => setMethodFilter(value)}
        onClear={() => setMethodFilter('')}
      />

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', aspectRatio: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div><div style={{ height: '16px', width: '50%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite', marginBottom: '12px' }} /><div style={{ height: '12px', width: '70%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div>
              <div style={{ height: '32px', width: '60%', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load payments'}</p>
          <button onClick={() => accountantStores.payments.load()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <CreditCard size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No payments found</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <CreditCard size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No payments match the current filter</p>
        </div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {pagination.items.map((payment, idx) => (
              <motion.div key={payment.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03, duration: 0.25 }} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', aspectRatio: '1' }}>
                {/* Header */}
                <div style={{ padding: '18px 20px 14px', background: methodGradient(payment.payment_method), borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700' }}>{payment.payment_number || `#${payment.id}`}</span>
                    <StatusBadge status={payment.payment_method} colorMap={{ cash: 'var(--accent-green)', bank_transfer: 'var(--accent-blue)', other: 'var(--accent-purple)' }} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {payment.stock_request?.request_number || '-'} * {payment.stock_request?.driver?.full_name || payment.driver?.full_name || '-'}
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Amount highlight */}
                    <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Amount</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: methodColor(payment.payment_method) }}>${Number(payment.amount || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <InfoCell icon={Calendar} label="Date" value={payment.payment_date || '-'} />
                      <InfoCell icon={Hash} label="Payment #" value={payment.payment_number || '-'} />
                    </div>
                  </div>
                  {payment.notes && (
                    <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {payment.notes}
                    </div>
                  )}
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

      {/* Record Payment Modal */}
      <Modal open={modalOpen} title="Record Payment" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <FormField label="Stock Request" required>
            <FormSelect value={form.stock_request_id} onChange={(v) => setForm({ ...form, stock_request_id: v, amount: '' })} options={requestOptions} placeholder="Select request" />
          </FormField>
          {selectedRequest && (
            <div style={{ padding: '12px 14px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Remaining balance: <strong style={{ color: 'var(--accent-orange)' }}>${Number(selectedRequest.remaining_amount || 0).toFixed(2)}</strong>
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
