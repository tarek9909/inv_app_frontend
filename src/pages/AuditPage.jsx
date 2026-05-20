import React, { useEffect, useState, useRef } from 'react';
import DataTable from '../components/DataTable.jsx';
import FormField, { FormInput, FormSelect } from '../components/FormField.jsx';
import { adminStores } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';

const columns = [
  { key: 'created_at', label: 'Timestamp', nowrap: true, render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : '—' },
  { key: 'user', label: 'User', render: (row) => row.user?.full_name || '—' },
  { key: 'action', label: 'Action' },
  { key: 'resource', label: 'Resource' },
  { key: 'details', label: 'Details', render: (row) => {
    if (!row.new_data && !row.old_data) return '—';
    const changes = [];
    if (row.old_data) changes.push(`from: ${JSON.stringify(row.old_data).slice(0, 50)}`);
    if (row.new_data) changes.push(`to: ${JSON.stringify(row.new_data).slice(0, 50)}`);
    return <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{changes.join(' → ')}</span>;
  }}
];

export default function AuditPage() {
  const { rows, meta, loading, error } = useStore(adminStores.auditLogs);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', action: '', resource: '' });
  const activeFiltersRef = useRef(filters);
  activeFiltersRef.current = filters;

  useEffect(() => { adminStores.auditLogs.load({ page: 1, limit: 20 }); }, []);

  const buildParams = (extra = {}) => {
    const f = activeFiltersRef.current;
    const params = { ...extra };
    if (f.start_date) params.start_date = f.start_date;
    if (f.end_date) params.end_date = f.end_date;
    if (f.action) params.action = f.action;
    if (f.resource) params.search = f.resource;
    return params;
  };

  const applyFilters = () => {
    adminStores.auditLogs.load(buildParams({ page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ start_date: '', end_date: '', action: '', resource: '' });
    adminStores.auditLogs.load({ page: 1 });
  };

  const handleLoad = (params) => {
    adminStores.auditLogs.load(buildParams(params));
  };

  return (
    <div>
      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <FormField label="From Date">
            <FormInput type="date" value={filters.start_date} onChange={(v) => setFilters({ ...filters, start_date: v })} />
          </FormField>
          <FormField label="To Date">
            <FormInput type="date" value={filters.end_date} onChange={(v) => setFilters({ ...filters, end_date: v })} />
          </FormField>
          <FormField label="Action">
            <FormInput value={filters.action} onChange={(v) => setFilters({ ...filters, action: v })} placeholder="e.g. create, update" />
          </FormField>
          <FormField label="Resource">
            <FormInput value={filters.resource} onChange={(v) => setFilters({ ...filters, resource: v })} placeholder="e.g. drivers, items" />
          </FormField>
          <button onClick={applyFilters} className="glass-button" style={{ fontSize: '13px', padding: '8px 16px', marginBottom: '16px' }}>
            Apply
          </button>
          {(filters.start_date || filters.end_date || filters.action || filters.resource) && (
            <button onClick={clearFilters} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        meta={meta}
        loading={loading}
        error={error}
        onLoad={handleLoad}
        emptyMessage="No audit logs match the current criteria"
      />
    </div>
  );
}
