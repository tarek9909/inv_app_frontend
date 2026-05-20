import React from 'react';

export default function TabBar({ tabs, active, onChange }) {
  const handleKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(tabs[(idx + 1) % tabs.length].key);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(tabs[(idx - 1 + tabs.length) % tabs.length].key);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(tabs[idx].key);
    }
  };

  return (
    <div role="tablist" style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px', overflowX: 'auto' }}>
      {tabs.map((tab, idx) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
