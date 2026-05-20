import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * Premium custom select dropdown with search
 * @param {Object} props
 * @param {string|number} props.value - Current selected value
 * @param {Function} props.onChange - (value) => void
 * @param {Array} props.options - [{ value, label }]
 * @param {string} props.placeholder - Placeholder text when nothing selected
 * @param {boolean} props.disabled - Disable the select
 * @param {boolean} props.searchable - Enable search (default: true when options > 5)
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select...', disabled = false, searchable }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [dropDirection, setDropDirection] = useState('down');

  const showSearch = searchable !== undefined ? searchable : options.length > 5;
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filtered = search.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (open) {
      setHighlightIndex(-1);
      // Determine drop direction
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropDirection(spaceBelow < 240 ? 'up' : 'down');
      }
    }
  }, [open, showSearch]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const handleSelect = useCallback((optValue) => {
    onChange(optValue);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filtered.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSearch('');
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="custom-select-container"
      style={{ position: 'relative', width: '100%' }}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(!open); }}
        disabled={disabled}
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '11px 14px',
          background: 'var(--input-bg)',
          border: open ? '1px solid var(--accent-blue)' : '1px solid var(--glass-border)',
          borderRadius: '12px',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '14px',
          fontFamily: 'inherit',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
          textAlign: 'left',
          boxShadow: open ? '0 0 0 2px rgba(56, 189, 248, 0.2)' : 'none',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {value && !disabled && (
            <span
              onClick={handleClear}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}
            >
              <X size={11} color="var(--text-muted)" />
            </span>
          )}
          <ChevronDown
            size={16}
            color="var(--text-muted)"
            style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="custom-select-dropdown"
          role="listbox"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            [dropDirection === 'up' ? 'bottom' : 'top']: '100%',
            marginTop: dropDirection === 'down' ? '6px' : undefined,
            marginBottom: dropDirection === 'up' ? '6px' : undefined,
            zIndex: 100,
            background: 'var(--select-dropdown-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            overflow: 'hidden',
            animation: 'selectDropIn 0.15s ease-out'
          }}
        >
          {/* Search Input */}
          {showSearch && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0); }}
                  placeholder="Search..."
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px' }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No options found
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightIndex;
                return (
                  <div
                    key={opt.value}
                    data-option
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                      background: isHighlighted
                        ? 'rgba(56, 189, 248, 0.1)'
                        : isSelected
                          ? 'rgba(56, 189, 248, 0.06)'
                          : 'transparent',
                      fontWeight: isSelected ? '500' : '400',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                    {isSelected && <Check size={14} color="var(--accent-blue)" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
