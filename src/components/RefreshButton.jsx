import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function RefreshButton({ onClick, loading = false, title = 'Refresh', style = {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={title}
      className="refresh-btn"
      style={{
        background: 'var(--surface-subtle)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-secondary)',
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        opacity: loading ? 0.5 : 1,
        flexShrink: 0,
        ...style
      }}
    >
      <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
    </button>
  );
}
