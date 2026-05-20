import React, { useEffect, useState, useRef } from 'react';
import { Eye, Clock, User as UserIcon, Zap, Database, ChevronDown, ChevronUp, ArrowRight, Plus, Minus, Edit3 } from 'lucide-react';
import DataTable, { StatusBadge } from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import FormField, { FormInput } from '../components/FormField.jsx';
import { adminStores } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';

const ACTION_COLORS = {
  create: 'var(--accent-green)',
  update: 'var(--accent-blue)',
  delete: 'var(--accent-red)',
  status: 'var(--accent-orange)',
  accept: 'var(--accent-blue)',
  complete: 'var(--accent-green)',
  cancel: 'var(--accent-red)',
  print: 'var(--accent-purple)',
  print_failed: 'var(--accent-red)',
  driver_receipt: 'var(--accent-blue)',
  invoice_viewed: 'var(--text-muted)'
};

const ACTION_ICONS = {
  create: Plus,
  update: Edit3,
  delete: Minus,
  status: Zap,
  accept: Zap,
  complete: Zap,
  cancel: Minus
};

const columns = [
  { key: 'created_at', label: 'Time', nowrap: true, render: (row) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Clock size={13} color="var(--text-muted)" />
      <span>{row.created_at ? formatTime(row.created_at) : '—'}</span>
    </div>
  )},
  { key: 'user', label: 'User', render: (row) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent-blue)' }}>{row.user?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
      </div>
      <span>{row.user?.full_name || '—'}</span>
    </div>
  )},
  { key: 'action', label: 'Action', render: (row) => {
    const color = ACTION_COLORS[row.action] || 'var(--text-secondary)';
    return <StatusBadge status={row.action} colorMap={{ [row.action]: color }} />;
  }},
  { key: 'module', label: 'Module', render: (row) => (
    <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
      {row.module || '—'}
    </span>
  )},
  { key: 'details', label: 'Changes', render: (row) => <InlineChanges row={row} /> }
];

function InlineChanges({ row }) {
  if (!row.new_data && !row.old_data) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;

  if (row.action === 'create') {
    const entries = Object.entries(row.new_data || {}).filter(([k]) => filterKey(k));
    if (!entries.length) return <span style={{ color: 'var(--accent-green)', fontSize: '12px' }}>New record</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {entries.slice(0, 3).map(([key, value]) => (
          <div key={key} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)', minWidth: '60px' }}>{formatKey(key)}:</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: '500' }}>{formatValue(value)}</span>
          </div>
        ))}
        {entries.length > 3 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{entries.length - 3} more fields</span>}
      </div>
    );
  }

  if (row.action === 'delete') {
    const name = row.old_data?.name || row.old_data?.full_name || row.old_data?.request_number || '';
    return <span style={{ fontSize: '12px', color: 'var(--accent-red)' }}>Deleted{name ? `: ${name}` : ''}</span>;
  }

  // Update / status / other — show field diffs
  const changes = getChangedFields(row.old_data, row.new_data);
  if (!changes.length) {
    // Fallback: show new_data summary
    const entries = Object.entries(row.new_data || {}).filter(([k]) => filterKey(k));
    if (!entries.length) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No visible changes</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {entries.slice(0, 2).map(([key, value]) => (
          <div key={key} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{formatKey(key)}:</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatValue(value)}</span>
          </div>
        ))}
        {entries.length > 2 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{entries.length - 2} more</span>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {changes.slice(0, 3).map((change) => (
        <div key={change.key} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', minWidth: '55px' }}>{formatKey(change.key)}</span>
          <span style={{ color: 'var(--accent-red)', textDecoration: 'line-through', fontSize: '11px' }}>{formatValue(change.from)}</span>
          <ArrowRight size={10} color="var(--text-muted)" />
          <span style={{ color: 'var(--accent-green)', fontWeight: '500', fontSize: '11px' }}>{formatValue(change.to)}</span>
        </div>
      ))}
      {changes.length > 3 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{changes.length - 3} more changes</span>}
    </div>
  );
}

export default function AuditPage() {
  const { rows, meta, loading, error } = useStore(adminStores.auditLogs);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', action: '', resource: '' });
  const [detailRow, setDetailRow] = useState(null);
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

  const applyFilters = () => adminStores.auditLogs.load(buildParams({ page: 1 }));
  const clearFilters = () => { setFilters({ start_date: '', end_date: '', action: '', resource: '' }); adminStores.auditLogs.load({ page: 1 }); };
  const handleLoad = (params) => adminStores.auditLogs.load(buildParams(params));

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
          <FormField label="Module">
            <FormInput value={filters.resource} onChange={(v) => setFilters({ ...filters, resource: v })} placeholder="e.g. drivers, items" />
          </FormField>
          <button onClick={applyFilters} className="glass-button" style={{ fontSize: '13px', padding: '8px 16px', marginBottom: '16px' }}>Apply</button>
          {(filters.start_date || filters.end_date || filters.action || filters.resource) && (
            <button onClick={clearFilters} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>Clear</button>
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
        actions={(row) => (
          <button onClick={() => setDetailRow(row)} title="View Details" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--accent-blue)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={14} />
          </button>
        )}
      />

      {/* Detail Modal */}
      <Modal open={!!detailRow} title="Audit Log Detail" onClose={() => setDetailRow(null)} width="680px">
        {detailRow && <AuditDetail row={detailRow} />}
      </Modal>
    </div>
  );
}

function AuditDetail({ row }) {
  const color = ACTION_COLORS[row.action] || 'var(--text-secondary)';
  const changes = getChangedFields(row.old_data, row.new_data);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Meta info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <InfoCard label="Timestamp" value={row.created_at ? new Date(row.created_at).toLocaleString() : '—'} />
        <InfoCard label="User" value={row.user?.full_name || '—'} />
        <InfoCard label="Action" value={<StatusBadge status={row.action} colorMap={{ [row.action]: color }} />} />
        <InfoCard label="Module" value={row.module || '—'} />
        <InfoCard label="Record ID" value={row.record_id || '—'} />
      </div>

      {/* Changes diff view */}
      {row.action === 'create' && row.new_data && (
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={14} /> Created Record</h4>
          <FieldGrid data={row.new_data} color="var(--accent-green)" />
        </div>
      )}

      {row.action === 'delete' && row.old_data && (
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '6px' }}><Minus size={14} /> Deleted Record</h4>
          <FieldGrid data={row.old_data} color="var(--accent-red)" />
        </div>
      )}

      {row.action !== 'create' && row.action !== 'delete' && (changes.length > 0 ? (
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}><Edit3 size={14} /> Changed Fields</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {changes.map((change) => (
              <div key={change.key} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{formatKey(change.key)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.15)', textDecoration: 'line-through' }}>
                    {formatValue(change.from)}
                  </span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '13px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-green)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    {formatValue(change.to)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        row.new_data && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)' }}>Payload</h4>
            <FieldGrid data={row.new_data} color="var(--text-secondary)" />
          </div>
        )
      ))}
    </div>
  );
}

function FieldGrid({ data, color }) {
  const entries = Object.entries(data || {}).filter(([key]) => filterKey(key));
  if (!entries.length) return <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No data</span>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
      {entries.map(([key, value]) => (
        <div key={key} style={{ padding: '8px 12px', borderRadius: '8px', background: `color-mix(in srgb, ${color} 4%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 12%, transparent)` }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{formatKey(key)}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{formatValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '500' }}>{value}</div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const IGNORED_KEYS = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at']);

function filterKey(key) {
  return !IGNORED_KEYS.has(key) && !key.endsWith('_at') && !key.endsWith('_by');
}

function formatKey(key) {
  return key.replace(/_/g, ' ').replace(/\bid\b/g, 'ID');
}

function formatValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `[${value.length} items]`;
    const str = JSON.stringify(value);
    return str.length > 60 ? str.slice(0, 57) + '...' : str;
  }
  const str = String(value);
  return str.length > 80 ? str.slice(0, 77) + '...' : str;
}

function getChangedFields(oldData, newData) {
  if (!oldData || !newData) return [];
  const changes = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of allKeys) {
    if (!filterKey(key)) continue;
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ key, from: oldVal, to: newVal });
    }
  }
  return changes;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}
