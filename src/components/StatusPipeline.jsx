import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Visual pipeline showing request progression through statuses
 * @param {Object} props
 * @param {Array} props.stages - [{ key, label, color, count }]
 * @param {string} props.active - currently selected stage key (or '' for all)
 * @param {Function} props.onChange - (key) => void
 */
export default function StatusPipeline({ stages = [], active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '12px 16px',
      borderRadius: '14px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--glass-border)',
      marginBottom: '20px',
      overflowX: 'auto'
    }}>
      {/* All button */}
      <PipelineStage
        label="All"
        color="var(--text-secondary)"
        count={stages.reduce((sum, s) => sum + (s.count || 0), 0)}
        isActive={!active}
        onClick={() => onChange('')}
      />
      {stages.map((stage, idx) => (
        <React.Fragment key={stage.key}>
          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.4 }} />
          <PipelineStage
            label={stage.label}
            color={stage.color}
            count={stage.count || 0}
            isActive={active === stage.key}
            onClick={() => onChange(active === stage.key ? '' : stage.key)}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function PipelineStage({ label, color, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '10px',
        border: isActive ? `1px solid ${color}` : '1px solid transparent',
        background: isActive ? `color-mix(in srgb, ${color} 12%, transparent)` : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
      }}
    >
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: color,
        boxShadow: isActive ? `0 0 8px ${color}` : 'none'
      }} />
      <span style={{ fontSize: '13px', fontWeight: isActive ? '600' : '400', color: isActive ? color : 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        color: isActive ? color : 'var(--text-muted)',
        background: isActive ? `color-mix(in srgb, ${color} 8%, transparent)` : 'rgba(255,255,255,0.05)',
        padding: '2px 7px',
        borderRadius: '6px'
      }}>
        {count}
      </span>
    </button>
  );
}
