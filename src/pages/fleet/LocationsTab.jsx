import React, { useEffect, useState, useMemo } from 'react';
import { Archive, Edit, MapPin, Plus, RotateCcw, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/DataTable.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, FormTextarea, SubmitButton } from '../../components/FormField.jsx';
import RefreshButton from '../../components/RefreshButton.jsx';
import { accountantStores, authStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { toast } from '../../components/Toast.jsx';

export default function LocationsTab() {
  const { rows, meta, loading, error, saving } = useStore(accountantStores.locations);
  const { user } = useStore(authStore);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { accountantStores.locations.load(); }, []);

  const can = (p) => user?.role?.code === 'admin' || (user?.permissions || []).includes(p);
  const handleSearch = (v) => { setSearch(v); clearTimeout(searchTimeout); setSearchTimeout(setTimeout(() => accountantStores.locations.load({ search: v, page: 1 }), 300)); };
  const goToPage = (page) => accountantStores.locations.load({ page });
  const { page = 1, pages = 1, total = 0 } = meta;

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', status: 'active' }); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ name: row.name || '', description: row.description || '', status: row.status || 'active' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Location name is required'); return; }
    try {
      if (editing) { await accountantStores.locations.update(editing.id, form); toast.success('Location updated'); }
      else { await accountantStores.locations.create(form); toast.success('Location created'); }
      setModalOpen(false); accountantStores.locations.load();
    } catch (err) { toast.error(err?.message || 'Failed to save location'); }
  };

  const toggleStatus = async (row) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    try { await accountantStores.locations.setStatus(row.id, next); toast.success(next === 'active' ? 'Restored' : 'Archived'); accountantStores.locations.load(); }
    catch (err) { toast.error(err?.message || 'Failed'); }
  };

  return (
    <>
      <FilterBar filters={[{ key: 'status', value: statusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }]} onChange={(k, v) => setStatusFilter(v)} onClear={() => setStatusFilter('')} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search locations..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} />
        </div>
        <RefreshButton onClick={() => accountantStores.locations.load({ force: true })} loading={loading} />
        <div style={{ marginLeft: 'auto' }}>
          {can('locations.manage') && <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openCreate}><Plus size={16} /> Add Location</button>}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card" style={{ padding: '24px', aspectRatio: '1' }}><div style={{ height: '16px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div>)}
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load'}</p><button onClick={() => accountantStores.locations.load()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button></div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><MapPin size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-muted)' }}>No locations found</p></div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          <AnimatePresence>
            {pagination.items.map((loc, idx) => (
              <motion.div key={loc.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03, duration: 0.25 }} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', aspectRatio: '1' }}>
                <div style={{ padding: '20px 20px 14px', background: loc.status === 'active' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={20} color="var(--accent-blue)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.name}</h3>
                      <StatusBadge status={loc.status} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{loc.description || 'No description'}</p>
                  {can('locations.manage') && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <CardAction icon={Edit} label="Edit" onClick={() => openEdit(loc)} color="var(--text-secondary)" />
                      <CardAction icon={loc.status === 'active' ? Archive : RotateCcw} label={loc.status === 'active' ? 'Archive' : 'Restore'} onClick={() => toggleStatus(loc)} color="var(--accent-purple)" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="locations" />
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Location' : 'Add Location'} onClose={() => setModalOpen(false)} width="480px">
        <form onSubmit={handleSubmit}>
          <FormField label="Location Name" required><FormInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Beirut" /></FormField>
          <FormField label="Description"><FormTextarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={3} placeholder="Optional notes" /></FormField>
          <FormField label="Status"><FormSelect value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }]} /></FormField>
          <SubmitButton loading={saving}><MapPin size={16} /> {editing ? 'Update' : 'Create'}</SubmitButton>
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
