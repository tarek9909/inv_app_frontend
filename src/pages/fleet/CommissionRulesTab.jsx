import React, { useEffect, useState, useMemo } from 'react';
import { Archive, Edit, Percent, Plus, RotateCcw, Search, AlertCircle, RefreshCw, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/DataTable.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, SubmitButton } from '../../components/FormField.jsx';
import { accountantStores, authStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { toast } from '../../components/Toast.jsx';

const blankForm = { location_id: '', base_commission_percent: '', target_amount: '', target_bonus_percent: '', effective_from: '', effective_until: '', status: 'active' };

export default function CommissionRulesTab() {
  const { rows, meta, loading, error, saving } = useStore(accountantStores.commissionRules);
  const locationsState = useStore(accountantStores.locations);
  const { user } = useStore(authStore);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { accountantStores.commissionRules.load(); accountantStores.locations.load({ limit: 100 }).catch(() => {}); }, []);

  const canManage = user?.role?.code === 'admin' || (user?.permissions || []).includes('commissions.manage');
  const handleSearch = (v) => { setSearch(v); clearTimeout(searchTimeout); setSearchTimeout(setTimeout(() => accountantStores.commissionRules.load({ search: v, page: 1 }), 300)); };
  const goToPage = (page) => accountantStores.commissionRules.load({ page });
  const { page = 1, pages = 1, total = 0 } = meta;

  const filteredRows = useMemo(() => { if (!statusFilter) return rows; return rows.filter((r) => r.status === statusFilter); }, [rows, statusFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  const openCreate = () => { setEditing(null); setForm(blankForm); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ location_id: row.location_id || '', base_commission_percent: row.base_commission_percent ?? '', target_amount: row.target_amount ?? '', target_bonus_percent: row.target_bonus_percent ?? '', effective_from: row.effective_from || '', effective_until: row.effective_until || '', status: row.status || 'active' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location_id) { toast.error('Please select a location'); return; }
    const payload = { location_id: Number(form.location_id), base_commission_percent: Number(form.base_commission_percent || 0), target_amount: Number(form.target_amount || 0), target_bonus_percent: Number(form.target_bonus_percent || 0), effective_from: form.effective_from || null, effective_until: form.effective_until || null, status: form.status };
    try {
      if (editing) { await accountantStores.commissionRules.update(editing.id, payload); toast.success('Rule updated'); }
      else { await accountantStores.commissionRules.create(payload); toast.success('Rule created'); }
      setModalOpen(false); accountantStores.commissionRules.load();
    } catch (err) { toast.error(err?.message || 'Failed to save'); }
  };

  const toggleStatus = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    try { await accountantStores.commissionRules.setStatus(row.id, next); toast.success(next === 'active' ? 'Restored' : 'Archived'); accountantStores.commissionRules.load(); }
    catch (err) { toast.error(err?.message || 'Failed'); }
  };

  const locationOptions = (locationsState.rows || []).filter((l) => l.status === 'active' || Number(l.id) === Number(form.location_id)).map((l) => ({ value: l.id, label: l.name }));

  return (
    <>
      <FilterBar filters={[{ key: 'status', value: statusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }]} onChange={(k, v) => setStatusFilter(v)} onClear={() => setStatusFilter('')} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search rules..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} />
        </div>
        <div style={{ marginLeft: 'auto' }}>{canManage && <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openCreate}><Plus size={16} /> Add Rule</button>}</div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card" style={{ padding: '24px', aspectRatio: '1' }}><div style={{ height: '16px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div>)}
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load'}</p><button onClick={() => accountantStores.commissionRules.load()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button></div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><Percent size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-muted)' }}>No commission rules found</p></div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {pagination.items.map((rule, idx) => (
              <motion.div key={rule.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03, duration: 0.25 }} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', aspectRatio: '1' }}>
                <div style={{ padding: '18px 20px 14px', background: rule.status === 'active' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} color="var(--accent-blue)" />
                      <span style={{ fontSize: '15px', fontWeight: '600' }}>{rule.location?.name || '-'}</span>
                    </div>
                    <StatusBadge status={rule.status} />
                  </div>
                </div>
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <MetricCell label="Base %" value={`${Number(rule.base_commission_percent || 0).toFixed(1)}%`} color="var(--accent-blue)" />
                      <MetricCell label="Target" value={`$${Number(rule.target_amount || 0).toFixed(0)}`} color="var(--accent-green)" />
                      <MetricCell label="Bonus %" value={`${Number(rule.target_bonus_percent || 0).toFixed(1)}%`} color="var(--accent-purple)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Calendar size={12} />
                      <span>{rule.effective_from || 'infinity'} {'->'} {rule.effective_until || 'infinity'}</span>
                    </div>
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
                      <CardAction icon={Edit} label="Edit" onClick={() => openEdit(rule)} color="var(--text-secondary)" />
                      <CardAction icon={rule.status === 'active' ? Archive : RotateCcw} label={rule.status === 'active' ? 'Archive' : 'Restore'} onClick={() => toggleStatus(rule)} color="var(--accent-purple)" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="rules" />
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Commission Rule' : 'Add Commission Rule'} onClose={() => setModalOpen(false)} width="560px">
        <form onSubmit={handleSubmit}>
          <FormField label="Location" required><FormSelect value={form.location_id} onChange={(v) => setForm({ ...form, location_id: v })} placeholder="Select location" options={locationOptions} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <FormField label="Base %" required><FormInput type="number" min="0" max="100" step="0.01" value={form.base_commission_percent} onChange={(v) => setForm({ ...form, base_commission_percent: v })} /></FormField>
            <FormField label="Target $" required><FormInput type="number" min="0" step="0.01" value={form.target_amount} onChange={(v) => setForm({ ...form, target_amount: v })} /></FormField>
            <FormField label="Bonus %" required><FormInput type="number" min="0" max="100" step="0.01" value={form.target_bonus_percent} onChange={(v) => setForm({ ...form, target_bonus_percent: v })} /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Effective From"><FormInput type="date" value={form.effective_from} onChange={(v) => setForm({ ...form, effective_from: v })} /></FormField>
            <FormField label="Effective Until"><FormInput type="date" value={form.effective_until} onChange={(v) => setForm({ ...form, effective_until: v })} /></FormField>
          </div>
          <FormField label="Status"><FormSelect value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }]} /></FormField>
          <SubmitButton loading={saving}><Percent size={16} /> {editing ? 'Update Rule' : 'Create Rule'}</SubmitButton>
        </form>
      </Modal>
    </>
  );
}

function MetricCell({ label, value, color }) {
  return (
    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: '700', color }}>{value}</div>
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
