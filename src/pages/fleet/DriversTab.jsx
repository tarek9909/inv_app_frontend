import React, { useEffect, useState, useMemo } from 'react';
import { Edit, Archive, RotateCcw, Trash2, Wallet, MapPin, Phone, Truck, User, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import { StatusBadge } from '../../components/DataTable.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Pagination, { useClientPagination } from '../../components/Pagination.jsx';
import FormField, { FormInput, FormSelect, FormTextarea, SubmitButton } from '../../components/FormField.jsx';
import { toast } from '../../components/Toast.jsx';
import { accountantStores, adminStores, authStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { USER_STATUSES } from '../../domain/index.js';

export default function DriversTab() {
  const { rows, meta, loading, error } = useStore(accountantStores.drivers);
  const locationsState = useStore(accountantStores.locations);
  const { user } = useStore(authStore);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [balanceModal, setBalanceModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    accountantStores.drivers.load();
    accountantStores.locations.load({ limit: 100 }).catch(() => {});
  }, [user]);

  const isAdmin = user?.role?.code === 'admin';
  const can = (permission) => isAdmin || (user?.permissions || []).includes(permission);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      accountantStores.drivers.load({ search: value, page: 1 });
    }, 300));
  };

  const goToPage = (page) => accountantStores.drivers.load({ page });
  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter((d) => d.status === statusFilter);
  }, [rows, statusFilter]);

  const pagination = useClientPagination(filteredRows, 12);

  const openCreate = null; // Drivers are created via Team → Add User with driver role

  const openEdit = (row) => {
    setEditing(row);
    setForm({ location_id: row.location_id || row.current_location_id || '', phone: row.phone || '', address: row.address || '', id_number: row.id_number || '', vehicle_type: row.vehicle_type || '', vehicle_plate_number: row.vehicle_plate_number || '', monthly_salary: row.monthly_salary ?? '', notes: row.notes || '', status: row.status || 'active', password: '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editing) return;

    const nextErrors = {};
    if (form.password && form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const { password, ...driverForm } = form;
      const payload = { ...driverForm, location_id: driverForm.location_id ? Number(driverForm.location_id) : null, monthly_salary: Number(driverForm.monthly_salary || 0) };
      await accountantStores.drivers.update(editing.id, payload);
      if (isAdmin && password && editing.user_id) {
        await adminStores.users.resetPassword(editing.user_id, password, { must_change_password: false });
      }
      toast.success(password ? 'Driver and password updated' : 'Driver updated');
      setModalOpen(false);
      accountantStores.drivers.load();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (row) => {
    const newStatus = row.status === 'active' ? 'inactive' : 'active';
    try {
      await accountantStores.drivers.setStatus(row.id, newStatus);
      toast.success(newStatus === 'active' ? 'Driver restored' : 'Driver archived');
      accountantStores.drivers.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const openBalance = async (row) => {
    try {
      const [balanceResult, statementResult] = await Promise.all([
        accountantStores.drivers.loadBalance(row.id),
        accountantStores.drivers.loadStatement(row.id).catch(() => null)
      ]);
      if (statementResult?.data) {
        setBalanceModal({ ...balanceResult.data, statement: statementResult.data });
        return;
      }
      setBalanceModal(balanceResult.data);
    } catch (err) {
      toast.error(err?.message || 'Failed to load balance');
    }
  };

  const openHistory = async (row) => {
    setHistoryModal(row);
    setHistoryRows([]);
    setHistoryLoading(true);
    try {
      const result = await accountantStores.drivers.loadLocationHistory(row.id);
      setHistoryRows(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load location history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await accountantStores.drivers.delete(deleteTarget.id);
      toast.success('Driver permanently deleted');
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    }
    setDeleteTarget(null);
  };

  const locationOptions = (locationsState.rows || [])
    .filter((location) => location.status === 'active' || Number(location.id) === Number(form.location_id))
    .map((location) => ({ value: location.id, label: location.name }));

  const { page = 1, pages = 1 } = meta;

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search drivers..."
            className="glass-input"
            style={{ paddingLeft: '36px', padding: '10px 12px 10px 36px', fontSize: '13px' }}
          />
        </div>
        <div style={{ marginLeft: 'auto' }}>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          { key: 'status', label: 'Status', value: statusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'blocked', label: 'Blocked' }] }
        ]}
        onChange={(key, value) => setStatusFilter(value)}
        onClear={() => setStatusFilter('')}
      />

      {/* Grid Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', height: '220px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '16px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite', marginBottom: '8px' }} />
                  <div style={{ height: '12px', width: '40%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
              <div style={{ height: '12px', width: '80%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite', marginBottom: '8px' }} />
              <div style={{ height: '12px', width: '50%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--accent-red)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error?.message || 'Failed to load drivers'}</p>
          <button onClick={() => accountantStores.drivers.load()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <User size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No drivers found</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <User size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No drivers match the current filter</p>
        </div>
      ) : (
        <motion.div
          layout
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}
        >
          <AnimatePresence>
            {pagination.items.map((driver, idx) => (
              <motion.div
                key={driver.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="glass-card"
                style={{ padding: '0', overflow: 'hidden', cursor: 'default' }}
              >
                {/* Card Header with gradient accent */}
                <div style={{
                  padding: '20px 20px 16px',
                  background: driver.status === 'active'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)',
                  borderBottom: '1px solid var(--glass-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', fontWeight: '700', color: 'var(--accent-blue)',
                      flexShrink: 0
                    }}>
                      {driver.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {driver.full_name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <StatusBadge status={driver.status} />
                        {driver.current_location?.name && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={10} /> {driver.current_location.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <InfoRow icon={Phone} label="Phone" value={driver.phone || '-'} />
                    <InfoRow icon={Truck} label="Vehicle" value={driver.vehicle_plate_number || '-'} />
                  </div>
                  {driver.monthly_salary > 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Monthly Salary</span>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--accent-green)' }}>${Number(driver.monthly_salary).toFixed(2)}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {can('drivers.view_balance') && (
                      <CardAction icon={Wallet} label="Balance" onClick={() => openBalance(driver)} color="var(--accent-green)" />
                    )}
                    {can('drivers.view') && (
                      <CardAction icon={MapPin} label="History" onClick={() => openHistory(driver)} color="var(--accent-blue)" />
                    )}
                    {can('drivers.update') && (
                      <CardAction icon={Edit} label="Edit" onClick={() => openEdit(driver)} color="var(--text-secondary)" />
                    )}
                    {can('drivers.archive') && (
                      <CardAction
                        icon={driver.status === 'active' ? Archive : RotateCcw}
                        label={driver.status === 'active' ? 'Archive' : 'Restore'}
                        onClick={() => toggleArchive(driver)}
                        color="var(--accent-purple)"
                      />
                    )}
                    {can('drivers.delete') && (
                      <CardAction icon={Trash2} label="Delete" onClick={() => setDeleteTarget(driver)} color="var(--accent-red)" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredRows.length > 0 && (
        <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="drivers" />
      )}

      {/* Modals */}
      <Modal open={modalOpen} title={editing ? `Edit Driver — ${editing.full_name}` : 'Edit Driver'} onClose={() => setModalOpen(false)} width="520px">
        <form onSubmit={handleSubmit}>
          <FormField label="Location">
            <FormSelect value={form.location_id} onChange={(v) => setForm({ ...form, location_id: v })} placeholder="No assigned location" options={locationOptions} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Phone">
              <FormInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Phone" />
            </FormField>
            <FormField label="ID Number">
              <FormInput value={form.id_number} onChange={(v) => setForm({ ...form, id_number: v })} placeholder="ID number" />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Vehicle Type">
              <FormInput value={form.vehicle_type} onChange={(v) => setForm({ ...form, vehicle_type: v })} placeholder="e.g. Truck" />
            </FormField>
            <FormField label="Plate Number">
              <FormInput value={form.vehicle_plate_number} onChange={(v) => setForm({ ...form, vehicle_plate_number: v })} placeholder="Plate #" />
            </FormField>
          </div>
          <FormField label="Monthly Salary">
            <FormInput type="number" min="0" step="0.01" value={form.monthly_salary} onChange={(v) => setForm({ ...form, monthly_salary: v })} placeholder="0.00" />
          </FormField>
          <FormField label="Address">
            <FormTextarea value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Address" rows={2} />
          </FormField>
          <FormField label="Notes">
            <FormTextarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Notes" rows={2} />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={USER_STATUSES.map((status) => ({ value: status, label: status }))} />
          </FormField>
          {isAdmin && editing?.user_id && (
            <FormField label="New Login Password" error={errors.password}>
              <FormInput
                type="password"
                value={form.password || ''}
                onChange={(v) => {
                  setForm({ ...form, password: v });
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                placeholder="Leave blank to keep current password"
              />
            </FormField>
          )}
          {isAdmin && editing && !editing.user_id && (
            <div style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--surface-subtle)', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' }}>
              This driver has no linked login account, so there is no password to update here.
            </div>
          )}
          <SubmitButton loading={saving}>Update Driver</SubmitButton>
        </form>
      </Modal>

      <Modal open={!!balanceModal} title={`Balance - ${balanceModal?.driver?.full_name || ''}`} onClose={() => setBalanceModal(null)} width="380px">
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Wallet size={28} color="var(--accent-green)" />
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Outstanding Balance</div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: Number(balanceModal?.balance || 0) > 0 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
            ${Number(balanceModal?.balance || 0).toFixed(2)}
          </div>
          {balanceModal?.statement && (
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <MiniMetric label="Receivables" value={balanceModal.statement.summary.stock_out_receivables} />
                <MiniMetric label="Returns" value={balanceModal.statement.summary.stock_return_credits} />
                <MiniMetric label="Payments" value={balanceModal.statement.summary.payments} />
                <MiniMetric label="Net" value={balanceModal.statement.summary.net_balance} />
              </div>
              <div style={{ maxHeight: '220px', overflow: 'auto', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                {(balanceModal.statement.rows || []).map((entry, index) => (
                  <div key={index} style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                    <span>{entry.reference} <span style={{ color: 'var(--text-muted)' }}>{entry.type}</span></span>
                    <strong>${Number(entry.running_balance || 0).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!historyModal} title={`Location History - ${historyModal?.full_name || ''}`} onClose={() => setHistoryModal(null)} width="680px">
        {historyLoading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '16px' }}>Loading history...</div>
        ) : historyRows.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Location', 'Assigned From', 'Assigned Until', 'Assigned By'].map((head) => (
                    <th key={head} style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', borderBottom: '1px solid var(--glass-border)' }}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{row.location?.name || '-'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{formatDateTime(row.assigned_from)}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{row.assigned_until ? formatDateTime(row.assigned_until) : 'Current'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{row.assigner?.full_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', padding: '16px' }}>No location history yet.</div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title="Permanently Delete Driver"
        message={`Delete ${deleteTarget?.full_name}? Drivers linked to stock requests or payments cannot be permanently deleted.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
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

function CardAction({ icon: Icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--glass-border)',
        color,
        padding: '7px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: '500',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div style={{ padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 700 }}>${Number(value || 0).toFixed(2)}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}
