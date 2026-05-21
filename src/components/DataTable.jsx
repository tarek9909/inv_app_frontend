import React, { useState, useRef, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function DataTable({ columns, rows, meta = {}, loading, error, onLoad, emptyMessage = 'No records found', actions, toolbar }) {
  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  const handleSearch = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onLoad?.({ search: value, page: 1 });
    }, 300);
  }, [onLoad]);

  const goToPage = (page) => {
    onLoad?.({ page });
  };

  const { page = 1, pages = 1, total = 0 } = meta;

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Toolbar */}
      <div className="table-toolbar" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="glass-input"
            style={{ paddingLeft: '36px', padding: '8px 12px 8px 36px', fontSize: '13px' }}
          />
        </div>
        {toolbar && <div className="toolbar-actions" style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>{toolbar}</div>}
      </div>

      {/* Desktop Table View */}
      <div className="table-desktop-view" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: columns.length > 4 ? '700px' : 'auto' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
              {actions && <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--glass-border)' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '14px 16px' }}>
                      <div style={{ height: '16px', borderRadius: '4px', background: 'var(--surface-subtle)', animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                  {actions && <td style={{ padding: '14px 16px' }}><div style={{ height: '16px', width: '60px', borderRadius: '4px', background: 'var(--surface-subtle)' }} /></td>}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: '40px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={24} color="var(--accent-red)" />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error?.message || 'Failed to load data'}</span>
                    <button onClick={() => onLoad?.({})} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <RefreshCw size={14} /> Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id || idx} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: col.nowrap ? 'nowrap' : 'normal' }}>
                      {col.render ? col.render(row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                  {actions && (
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card Grid View */}
      <div className="table-card-view" style={{ display: 'none' }}>
        {loading ? (
          <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)' }}>
                <div style={{ height: '14px', width: '40%', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite', marginBottom: '12px' }} />
                <div style={{ height: '12px', width: '70%', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite', marginBottom: '8px' }} />
                <div style={{ height: '12px', width: '55%', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={24} color="var(--accent-red)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error?.message || 'Failed to load data'}</span>
              <button onClick={() => onLoad?.({})} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {emptyMessage}
          </div>
        ) : (
          <div style={{ padding: '12px', display: 'grid', gap: '10px' }}>
            {rows.map((row, idx) => (
              <div
                key={row.id || idx}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Card fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 12px' }}>
                  {columns.map((col) => (
                    <div key={col.key} style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                        {col.label}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {col.render ? col.render(row) : row[col.key] ?? '-'}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Card actions */}
                {actions && (
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)', marginTop: '4px' }}>
                    {actions(row)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && rows.length > 0 && (
        <div className="table-pagination" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{total} record{total !== 1 ? 's' : ''}</span>
          {pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <PgBtn onClick={() => goToPage(1)} disabled={page <= 1}><ChevronsLeft size={14} /></PgBtn>
              <PgBtn onClick={() => goToPage(page - 1)} disabled={page <= 1}><ChevronLeft size={14} /></PgBtn>
              {getPageNumbers(page, pages).map((p, idx) => (
                p === '...' ? <span key={`e${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>…</span> : (
                  <button key={p} onClick={() => goToPage(p)} style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: p === page ? '1px solid var(--accent-blue)' : '1px solid transparent', background: p === page ? 'rgba(59, 130, 246, 0.15)' : 'transparent', color: p === page ? 'var(--accent-blue)' : 'var(--text-secondary)', fontWeight: p === page ? '600' : '400', fontSize: '13px', cursor: 'pointer' }}>{p}</button>
                )
              ))}
              <PgBtn onClick={() => goToPage(page + 1)} disabled={page >= pages}><ChevronRight size={14} /></PgBtn>
              <PgBtn onClick={() => goToPage(pages)} disabled={page >= pages}><ChevronsRight size={14} /></PgBtn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PgBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1 }}>
      {children}
    </button>
  );
}

function getPageNumbers(page, pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 4, '...', pages];
  if (page >= pages - 2) return [1, '...', pages - 3, pages - 2, pages - 1, pages];
  return [1, '...', page - 1, page, page + 1, '...', pages];
}

export function ActionButton({ icon: Icon, label, onClick, color = 'var(--text-secondary)' }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color, padding: '8px', minWidth: '36px', minHeight: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon size={20} />
    </button>
  );
}

export function StatusBadge({ status, colorMap = {} }) {
  const defaultColors = {
    active: 'var(--accent-green)',
    inactive: 'var(--accent-orange)',
    blocked: 'var(--accent-red)',
    draft: 'var(--text-muted)',
    pending: 'var(--accent-orange)',
    approved: 'var(--accent-green)',
    partially_received: 'var(--accent-blue)',
    received: 'var(--accent-green)',
    completed: 'var(--accent-green)',
    cancelled: 'var(--accent-red)',
    paid: 'var(--accent-green)',
    partially_paid: 'var(--accent-blue)',
    stock_out: 'var(--accent-orange)',
    stock_return: 'var(--accent-blue)'
  };
  const color = colorMap[status] || defaultColors[status] || 'var(--text-secondary)';
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `color-mix(in srgb, ${color} 15%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status?.replace(/_/g, ' ') || '-'}
    </span>
  );
}
