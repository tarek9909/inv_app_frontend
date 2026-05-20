import React from 'react';
import { Filter, X } from 'lucide-react';

/**
 * Reusable filter bar with chips for status/type filtering
 * @param {Object} props
 * @param {Array} props.filters - Array of { key, label, options: [{ value, label }], value }
 * @param {Function} props.onChange - (key, value) => void
 * @param {Function} props.onClear - () => void
 */
export default function FilterBar({ filters = [], onChange, onClear }) {
  const hasActive = filters.some((f) => f.value);

  return (
    <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
      <Filter size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      {filters.map((filter) => (
        <div key={filter.key} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {filter.options.map((opt) => {
            const isActive = filter.value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(filter.key, isActive ? '' : opt.value)}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--glass-border)',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ))}
      {hasActive && (
        <button
          onClick={onClear}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', flexShrink: 0 }}
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}
