import React from 'react';
import { Check } from 'lucide-react';

/**
 * Premium styled checkbox with animation
 * @param {Object} props
 * @param {boolean} props.checked
 * @param {Function} props.onChange
 * @param {boolean} props.disabled
 */
export default function PremiumCheckbox({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`premium-checkbox ${checked ? 'premium-checkbox--checked' : ''}`}
      style={{
        width: '20px',
        height: '20px',
        minWidth: '20px',
        borderRadius: '6px',
        border: checked
          ? '1.5px solid var(--accent-blue)'
          : '1.5px solid var(--glass-border)',
        background: checked
          ? 'linear-gradient(135deg, var(--accent-blue), #2563eb)'
          : 'var(--input-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: 0,
        outline: 'none',
        boxShadow: checked
          ? '0 2px 8px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
          : 'inset 0 1px 2px rgba(0,0,0,0.1)',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0
      }}
    >
      {checked && (
        <Check
          size={13}
          color="white"
          strokeWidth={3}
          style={{ animation: 'checkPop 0.2s ease-out' }}
        />
      )}
    </button>
  );
}
