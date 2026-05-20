import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children, width = '480px' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusable = containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const first = containerRef.current?.querySelector('input, select, textarea, button');
      first?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="modal-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="glass-panel modal-container"
            style={{ width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'sticky', top: 0, zIndex: 1 }}>
              <h2 id="modal-title" style={{ fontSize: '20px', fontWeight: '600' }}>{title}</h2>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <Modal open={open} title={title || 'Confirm Action'} onClose={onCancel} width="400px">
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={onCancel} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '500', flex: '1 1 auto', minWidth: '100px' }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ background: 'linear-gradient(135deg, var(--accent-red), #dc2626)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '500', opacity: loading ? 0.6 : 1, flex: '1 1 auto', minWidth: '100px' }}>
          {loading ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
}
