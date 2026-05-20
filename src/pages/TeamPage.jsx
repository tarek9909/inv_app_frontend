import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Shield, KeyRound } from 'lucide-react';
import DataTable, { ActionButton, StatusBadge } from '../components/DataTable.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Modal from '../components/Modal.jsx';
import FormField, { FormInput, FormSelect, SubmitButton } from '../components/FormField.jsx';
import PremiumCheckbox from '../components/PremiumCheckbox.jsx';
import { toast } from '../components/Toast.jsx';
import { adminStores, authStore } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';
import { USER_STATUSES } from '../domain/index.js';
const columns = [
  { key: 'full_name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (row) => row.role?.name || '-' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> }
];

export default function TeamPage() {
  const { rows, meta, loading, error } = useStore(adminStores.users);
  const rolesState = useStore(adminStores.roles);
  const permissionsState = useStore(adminStores.permissions);
  const { user } = useStore(authStore);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', code: '', description: '' });
  const [rolePermissions, setRolePermissions] = useState([]);
  const [roleSaving, setRoleSaving] = useState(false);

  const can = (permission) => user?.role?.code === 'admin' || (user?.permissions || []).includes(permission);
  const canManageUsers = can('users.manage');
  const canManageRoles = can('roles.manage');

  useEffect(() => {
    adminStores.users.load();
    adminStores.roles.load();
    if (canManageRoles) adminStores.permissions.load();
  }, [canManageRoles]);

  const openCreate = () => {
    setEditing(null);
    setForm({ full_name: '', email: '', password: '', role_id: '', monthly_salary: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ full_name: row.full_name || '', email: row.email || '', role_id: row.role_id || '', monthly_salary: row.driver_link?.driver?.monthly_salary ?? '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name?.trim()) errs.full_name = 'Name is required';
    if (!form.email?.trim()) errs.email = 'Email is required';
    if (!editing && (!form.password || form.password.length < 6)) errs.password = 'Min 6 characters';
    if (!form.role_id) errs.role_id = 'Role is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const selectedRole = (rolesState.rows || []).find((role) => Number(role.id) === Number(form.role_id));
      const driverValues = selectedRole?.code === 'driver' ? { monthly_salary: Number(form.monthly_salary || 0) } : {};
      const { monthly_salary: ignoredSalary, ...userForm } = form;
      if (editing) {
        await adminStores.users.update(editing.id, { full_name: userForm.full_name, email: userForm.email, role_id: userForm.role_id, ...driverValues });
        toast.success('User updated');
      } else {
        await adminStores.users.create({ ...userForm, ...driverValues });
        toast.success('User created');
      }
      setModalOpen(false);
      adminStores.users.load();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await adminStores.users.setStatus(statusModal.id, status);
      toast.success(`User status changed to ${status}`);
      adminStores.users.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to change status');
    }
    setStatusModal(null);
  };

  const openRoleModal = async (role = null) => {
    setRoleModal(role || { id: null });
    setRoleForm(role ? { name: role.name || '', code: role.code || '', description: role.description || '' } : { name: '', code: '', description: '' });
    if (role?.id) {
      try {
        const result = await adminStores.roles.getPermissions(role.id);
        setRolePermissions(result.data?.permissions || []);
      } catch (err) {
        toast.error(err?.message || 'Failed to load role permissions');
        setRolePermissions([]);
      }
    } else {
      setRolePermissions([]);
    }
  };

  const handleRoleSubmit = async (event) => {
    event.preventDefault();
    setRoleSaving(true);
    try {
      let role = roleModal;
      if (roleModal?.id) {
        const result = await adminStores.roles.update(roleModal.id, roleForm);
        role = result.data;
      } else {
        const result = await adminStores.roles.create(roleForm);
        role = result.data;
      }
      if (role?.id && role.code !== 'admin') await adminStores.roles.updatePermissions(role.id, rolePermissions);
      toast.success('Role saved');
      setRoleModal(null);
      adminStores.roles.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to save role');
    } finally {
      setRoleSaving(false);
    }
  };

  const togglePermission = (key) => {
    setRolePermissions((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const roleOptions = (rolesState.rows || []).map((r) => ({ value: r.id, label: r.name }));
  const selectedRole = (rolesState.rows || []).find((role) => Number(role.id) === Number(form.role_id));
  const groupedPermissions = (permissionsState.rows || []).reduce((groups, permission) => {
    const module = permission.module || 'Other';
    const feature = permission.feature || 'General';
    groups[module] = groups[module] || {};
    groups[module][feature] = groups[module][feature] || [];
    groups[module][feature].push(permission);
    return groups;
  }, {});

  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const roleFilterOptions = useMemo(() => (rolesState.rows || []).map((r) => ({ value: String(r.id), label: r.name })), [rolesState.rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter) result = result.filter((u) => u.status === statusFilter);
    if (roleFilter) result = result.filter((u) => String(u.role_id) === roleFilter);
    return result;
  }, [rows, statusFilter, roleFilter]);

  return (
    <>
      {/* Filters */}
      <FilterBar
        filters={[
          { key: 'status', label: 'Status', value: statusFilter, options: USER_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })) },
          ...(roleFilterOptions.length > 0 ? [{ key: 'role', label: 'Role', value: roleFilter, options: roleFilterOptions }] : [])
        ]}
        onChange={(key, value) => { if (key === 'status') setStatusFilter(value); if (key === 'role') setRoleFilter(value); }}
        onClear={() => { setStatusFilter(''); setRoleFilter(''); }}
      />

      <DataTable
        columns={columns}
        rows={filteredRows}
        meta={meta}
        loading={loading}
        error={error}
        onLoad={(filters) => adminStores.users.load(filters)}
        toolbar={canManageUsers &&
          <button className="glass-button" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={openCreate}>
            <Plus size={16} /> Add User
          </button>
        }
        actions={canManageUsers ? (row) => (
          <>
            <ActionButton icon={Edit} label="Edit" onClick={() => openEdit(row)} />
            <ActionButton icon={Shield} label="Change Status" onClick={() => setStatusModal(row)} color="var(--accent-purple)" />
          </>
        ) : undefined}
      />

      <div className="glass-card" style={{ marginTop: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Roles & Permissions</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Control access to tabs, flows, actions, and subfeatures.</p>
          </div>
          {canManageRoles && <button className="glass-button" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={() => openRoleModal()}>
            <Plus size={16} /> Add Role
          </button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {(rolesState.rows || []).map((role) => (
            <div key={role.id} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontWeight: 700 }}>{role.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '4px 0 12px' }}>{role.code}</div>
              {canManageRoles && <button type="button" onClick={() => openRoleModal(role)} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--accent-blue)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={14} /> Permissions
              </button>}
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit User' : 'Add User'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <FormField label="Full Name" required error={errors.full_name}>
            <FormInput value={form.full_name} onChange={(v) => { setForm({ ...form, full_name: v }); setErrors({ ...errors, full_name: null }); }} placeholder="Full name" />
          </FormField>
          <FormField label="Email" required error={errors.email}>
            <FormInput type="email" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); setErrors({ ...errors, email: null }); }} placeholder="Email" />
          </FormField>
          {!editing && (
            <FormField label="Password" required error={errors.password}>
              <FormInput type="password" value={form.password} onChange={(v) => { setForm({ ...form, password: v }); setErrors({ ...errors, password: null }); }} placeholder="Min 6 characters" />
            </FormField>
          )}
          <FormField label="Role" required error={errors.role_id}>
            <FormSelect value={form.role_id} onChange={(v) => { setForm({ ...form, role_id: v }); setErrors({ ...errors, role_id: null }); }} options={roleOptions} placeholder="Select role" />
          </FormField>
          {selectedRole?.code === 'driver' && (
            <FormField label="Monthly Salary">
              <FormInput type="number" min="0" step="0.01" value={form.monthly_salary} onChange={(v) => setForm({ ...form, monthly_salary: v })} placeholder="0.00" />
            </FormField>
          )}
          <SubmitButton loading={saving}>{editing ? 'Update' : 'Create'}</SubmitButton>
        </form>
      </Modal>

      <Modal open={!!statusModal} title={`Change Status - ${statusModal?.full_name || ''}`} onClose={() => setStatusModal(null)} width="360px">
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Select new status:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {USER_STATUSES.map((status) => (
            <button key={status} onClick={() => handleStatusChange(status)} disabled={statusModal?.status === status} style={{ background: statusModal?.status === status ? 'var(--surface-muted)' : 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: '10px', cursor: statusModal?.status === status ? 'default' : 'pointer', textAlign: 'left', fontSize: '14px', textTransform: 'capitalize', opacity: statusModal?.status === status ? 0.5 : 1 }}>
              {status} {statusModal?.status === status && '(current)'}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={!!roleModal} title={roleModal?.id ? `Role: ${roleForm.name}` : 'Add Role'} onClose={() => setRoleModal(null)} width="760px">
        <form onSubmit={handleRoleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Role Name" required><FormInput value={roleForm.name} onChange={(v) => setRoleForm({ ...roleForm, name: v })} disabled={roleForm.code === 'admin'} /></FormField>
            <FormField label="Role Code" required><FormInput value={roleForm.code} onChange={(v) => setRoleForm({ ...roleForm, code: v })} disabled={roleForm.code === 'admin'} placeholder="custom_role" /></FormField>
          </div>
          <FormField label="Description"><FormInput value={roleForm.description} onChange={(v) => setRoleForm({ ...roleForm, description: v })} /></FormField>
          {roleForm.code === 'admin' ? (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Admin always has all permissions.</p>
          ) : (
            <div style={{ maxHeight: '420px', overflow: 'auto', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: 'var(--surface-subtle)' }}>
              {Object.entries(groupedPermissions).map(([module, features]) => (
                <div key={module} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(139, 92, 246, 0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={14} color="var(--accent-blue)" />
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{module}</h3>
                  </div>
                  {Object.entries(features).map(([feature, permissions]) => (
                    <div key={feature} style={{ marginBottom: '14px', paddingLeft: '12px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 500 }}>{feature}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                        {permissions.map((permission) => {
                          const isChecked = rolePermissions.includes(permission.permission_key);
                          return (
                            <div
                              key={permission.permission_key}
                              onClick={() => togglePermission(permission.permission_key)}
                              style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'flex-start',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                background: isChecked ? 'rgba(56, 189, 248, 0.06)' : 'transparent',
                                border: isChecked ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <PremiumCheckbox checked={isChecked} onChange={() => togglePermission(permission.permission_key)} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: isChecked ? 'var(--accent-blue)' : 'var(--text-primary)', transition: 'color 0.15s' }}>{permission.permission_key}</div>
                                {permission.description && <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px', lineHeight: '1.4' }}>{permission.description}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <SubmitButton loading={roleSaving}>Save Role</SubmitButton>
        </form>
      </Modal>
    </>
  );
}
