import React from 'react';

export default function FormField({ label, error, children, required }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {label}{required && <span style={{ color: 'var(--accent-red)' }}> *</span>}
        </label>
      )}
      {children}
      {error && <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--accent-red)' }}>{error}</p>}
    </div>
  );
}

export function FormInput({ value, onChange, type = 'text', placeholder, ...props }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="glass-input"
      style={{ fontSize: '14px' }}
      {...props}
    />
  );
}

export function FormSelect({ value, onChange, options = [], placeholder }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="glass-input"
      style={{ fontSize: '14px', appearance: 'none' }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export function FormTextarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="glass-input"
      style={{ fontSize: '14px', resize: 'vertical' }}
    />
  );
}

export function SubmitButton({ loading, children = 'Save' }) {
  return (
    <button type="submit" className="glass-button" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
      {loading ? 'Saving...' : children}
    </button>
  );
}
