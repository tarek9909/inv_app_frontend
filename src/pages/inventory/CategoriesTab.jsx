import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Archive, RotateCcw, Trash2, Search, AlertCircle, RefreshCw, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../components/DataTable.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, FormTextarea, SubmitButton } from '../../components/FormField.jsx';
import RefreshButton from '../../components/RefreshButton.jsx';
import { toast } from '../../components/Toast.jsx';
import { authStore, inventoryStores } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { ACTIVE_STATUSES } from '../../domain/index.js';

export default function CategoriesTab() {
  const { rows, meta, loading, error } = useStore(inventoryStores.categories);
  const { user } = useStore(authStore);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { inventoryStores.categories.load(); }, []);

  const can = (p) => user?.role?.code === 'admin' || (user?.permissions || []).includes(p);
  const handleSearch = (v) => { setSearch(v); clearTimeout(searchTimeout); setSearchTimeout(setTimeout(() => inventoryStores.categories.load({ search: v, page: 1 }), 300)); };

  const filteredRows = useMemo(() => { if (!statusFilter) return rows; return rows.filter((r) => r.status === statusFilter); }, [rows, statusFilter]);
  const pagination = useClientPagination(filteredRows, 18);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', status: 'active' }); setErrors({}); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ name: row.name || '', description: row.description || '', status: row.status || 'active' }); setErrors({}); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    setSaving(true);
    try {
      if (editing) { await inventoryStores.categories.update(editing.id, { name: form.name, description: form.description }); toast.success('Category updated'); }
      else { await inventoryStores.categories.create(form); toast.success('Category created'); }
      setModalOpen(false);
    } catch (err) { toast.error(err?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const toggleArchive = async (row) => {
    try { await inventoryStores.categories.setStatus(row.id, row.status === 'inactive' ? 'active' : 'inactive'); toast.success(row.status === 'inactive' ? 'Restored' : 'Archived'); inventoryStores.categories.load(); }
    catch (err) { toast.error(err?.message || 'Failed'); }
  };

  const confirmDelete = async () => {
    try { await inventoryStores.categories.delete(deleteTarget.id); toast.success('Category deleted'); } catch (err) { toast.error(err?.message || 'Delete failed'); }
    setDeleteTarget(null);
  };

  return (
    <>
      <FilterBar filters={[{ key: 'status', value: statusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] }]} onChange={(k, v) => setStatusFilter(v)} onClear={() => setStatusFilter('')} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search categories..." className="glass-input" style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }} />
        </div>
        <RefreshButton onClick={() => inventoryStores.categories.load({ force: true })} loading={loading} />
        <div style={{ marginLeft: 'auto' }}>{can('categories.manage') && <button className="glass-button" style={{ fontSize: '13px', padding: '10px 18px' }} onClick={openCreate}><Plus size={16} /> Add Category</button>}</div>
      </div>

      {loading ? <GridSkeleton /> : error ? <ErrorState onRetry={() => inventoryStores.categories.load()} message={error?.message} /> : pagination.items.length === 0 ? (
        <EmptyState icon={FolderOpen} message={filteredRows.length === 0 && rows.length > 0 ? 'No categories match the filter' : 'No categories found'} />
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          <AnimatePresence>
            {pagination.items.map((cat, idx) => (
              <motion.div key={cat.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03, duration: 0.25 }} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '138px' }}>
                <div style={{ padding: '12px 14px 10px', background: cat.status === 'active' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(100, 100, 100, 0.04) 100%)', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.15))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FolderOpen size={16} color="var(--accent-blue)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</h3>
                      <StatusBadge status={cat.status} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '10px' }}>{cat.description || 'No description'}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {can('categories.manage') && <CardAction icon={Edit} label="Edit" onClick={() => openEdit(cat)} color="var(--text-secondary)" />}
                    {can('categories.archive') && <CardAction icon={cat.status === 'active' ? Archive : RotateCcw} label={cat.status === 'active' ? 'Archive' : 'Restore'} onClick={() => toggleArchive(cat)} color="var(--accent-purple)" />}
                    {can('categories.delete') && <CardAction icon={Trash2} label="Delete" onClick={() => setDeleteTarget(cat)} color="var(--accent-red)" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && !error && filteredRows.length > 0 && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="categories" />}

      <Modal open={modalOpen} title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <FormField label="Name" required error={errors.name}><FormInput value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setErrors({}); }} placeholder="Category name" /></FormField>
          <FormField label="Description"><FormTextarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Optional description" /></FormField>
          {!editing && <FormField label="Status"><FormSelect value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={ACTIVE_STATUSES.map((s) => ({ value: s, label: s }))} /></FormField>}
          <SubmitButton loading={saving}>{editing ? 'Update' : 'Create'}</SubmitButton>
        </form>
      </Modal>
      <ConfirmModal open={!!deleteTarget} title="Delete Category" message={`Delete ${deleteTarget?.name}? Categories linked to items cannot be deleted.`} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}

function CardAction({ icon: Icon, label, onClick, color }) {
  return (<button onClick={onClick} title={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color, padding: '6px 9px', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '500', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}><Icon size={12} /><span>{label}</span></button>);
}
function GridSkeleton() { return (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>{Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass-card" style={{ padding: '14px', minHeight: '138px' }}><div style={{ height: '16px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div>)}</div>); }
function ErrorState({ onRetry, message }) { return (<div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{message || 'Failed to load'}</p><button onClick={onRetry} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={14} /> Retry</button></div>); }
function EmptyState({ icon: Icon, message }) { return (<div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}><Icon size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} /><p style={{ color: 'var(--text-muted)' }}>{message}</p></div>); }
