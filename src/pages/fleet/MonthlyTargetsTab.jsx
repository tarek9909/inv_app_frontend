import React, { useEffect, useState, useMemo } from 'react';
import { Archive, Edit, Plus, RotateCcw, Target, Search, AlertCircle, RefreshCw, MapPin, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/DataTable.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, SubmitButton } from '../../components/FormField.jsx';
import RefreshButton from '../../components/RefreshButton.jsx';
import { accountantStores, authStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { toast } from '../../components/Toast.jsx';

const thisMonth = () => new Date().toISOString().slice(0, 7);
const blankForm = { location_id: '', target_month: thisMonth(), target_mode: 'location_total', target_amount: '', status: 'active' };

export default function MonthlyTargetsTab() {
  const { rows, meta, loading, error, saving } = useStore(accountantStores.monthlyTargets);
  const locationsState = useStore(accountantStores.locations);
  const { user } = useStore(authStore);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  useEffect(() => { accountantStores.monthlyTargets.load(); accountantStores.locations.load({ limit: 100 }).catch(() => {}); }, []);

  const canManage = user?.role?.code === 'admin' || (user?.permissions || []).includes('targets.manage');
  const handleSearch = (v) => { setSearch(v); clearTimeout(searchTimeout); setSearchTimeout(setTimeout(() => accountantStores.monthlyTargets.load({ search: v, page: 1 }), 300)); };
  const goToPage = (page) => accountantStores.monthlyTargets.load({ page });
  const { page = 1, pages = 1, total = 0 } = meta;

  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    if (modeFilter) result = result.filter((r) => r.target_mode === modeFilter);
    return result;
  }, [rows, statusFilter, modeFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  const locationOptions = (locationsState.rows || []).filter((l) => l.status === 'active' || Number(l.id) === Number(form.location_id)).map((l) => ({ value: l.id, label: l.name }));

  const openCreate = () => { setEditing(null); setForm(blankForm); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ location_id: row.location_id || '', target_month: row.target_month || thisMonth(), target_mode: row.target_mode || 'location_total', target_amount: row.target_amount ?? '', status: row.status || 'active' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location_id) { toast.error('Please select a location'); return; }
    const payload = { location_id: Number(form.location_id), target_month: form.target_month, target_mode: form.target_mode, target_amount: Number(form.target_amount || 0), status: form.status };
    try {
      if (editing) { await accountantStores.monthlyTargets.update(editing.id, payload); toast.success('Target updated'); }
      else { await accountantStores.monthlyTargets.create(payload); toast.success('Target created'); }
      setModalOpen(false); accountantStores.monthlyTargets.load();
    } catch (err) { toast.error(err?.message || 'Failed to save'); }
  };

  const toggleStatus = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    try { await accountantStores.monthlyTargets.setStatus(row.id, next); toast.success(next === 'active' ? 'Restored' : 'Archived'); accountantStores.monthlyTargets.load(); }
    catch (err) { toast.error(err?.message || 'Failed'); }
  };

  return (
    <>
      <FilterBar
        filters={[
          { key: 'status', value: statusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
          { key: 'mode', value: modeFilter, options: [{ value: 'location_total', label: 'Location Total' }, { value: 'per_driver', label: 'Per Driver' }] }
        ]}
        onChange={(k, v) => { if (k === 'status') setStatusFilter(v); if (k === 'mode') setModeFilter(v); }}
        onClear={() => { setStatusFilter(''); setModeFilter(''); }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search targets..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} />
        </div>
        <RefreshButton onClick={() => accountantStores.monthlyTargets.load({ force: true })} loading={loading} />
        <div style={{ marginLeft: 'auto' }}>{canManage && <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openCreate}><Plus size={16} /> Add Target</button>}</div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card" style={{ padding: '24px', aspectRatio: '1' }}><div style={{ height: '16px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div>)}
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load'}</p><button onClick={() => accountantStores.monthlyTargets.load()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button></div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><Target size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-muted)' }}>No monthly targets found</p></div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {pagination.items.map((target, idx) => (
              <motion.div key={target.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03, duration: 0.25 }} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', aspectRatio: '1' }}>
                <div style={{ padding: '18px 20px 14px', background: target.status === 'active' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)' : 'linear-gradient(135deg, rgba(100, 100, 100, 0.08) 0%, rgba(50, 50, 50, 0.04) 100%)', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={16} color="var(--accent-orange)" />
                      <span style={{ fontSize: '15px', fontWeight: '600' }}>{target.location?.name || '-'}</span>
                    </div>
                    <StatusBadge status={target.status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <Calendar size={12} /> <span>{target.target_month}</span>
                    <span style={{ margin: '0 4px' }}>*</span>
                    <Users size={12} /> <span>{target.target_mode === 'per_driver' ? 'Per Driver' : 'Location Total'}</span>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', textAlign: 'center', marginBottom: '14px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Target Amount</div>
                    <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--accent-orange)' }}>${Number(target.target_amount || 0).toFixed(2)}</div>
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <CardAction icon={Edit} label="Edit" onClick={() => openEdit(target)} color="var(--text-secondary)" />
                      <CardAction icon={target.status === 'active' ? Archive : RotateCcw} label={target.status === 'active' ? 'Archive' : 'Restore'} onClick={() => toggleStatus(target)} color="var(--accent-purple)" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="targets" />
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Monthly Target' : 'Add Monthly Target'} onClose={() => setModalOpen(false)} width="520px">
        <form onSubmit={handleSubmit}>
          <FormField label="Location" required><FormSelect value={form.location_id} onChange={(v) => setForm({ ...form, location_id: v })} placeholder="Select location" options={locationOptions} /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Month" required><FormInput type="month" value={form.target_month} onChange={(v) => setForm({ ...form, target_month: v })} /></FormField>
            <FormField label="Mode" required><FormSelect value={form.target_mode} onChange={(v) => setForm({ ...form, target_mode: v })} options={[{ value: 'location_total', label: 'Location total' }, { value: 'per_driver', label: 'Per driver' }]} /></FormField>
          </div>
          <FormField label={form.target_mode === 'per_driver' ? 'Target Per Driver' : 'Location Target'} required><FormInput type="number" min="0" step="0.01" value={form.target_amount} onChange={(v) => setForm({ ...form, target_amount: v })} /></FormField>
          <FormField label="Status"><FormSelect value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }]} /></FormField>
          <SubmitButton loading={saving}><Target size={16} /> {editing ? 'Update' : 'Create'}</SubmitButton>
        </form>
      </Modal>
    </>
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
