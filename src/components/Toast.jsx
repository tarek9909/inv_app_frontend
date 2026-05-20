import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

let toastId = 0;
let addToastFn = null;

export const toast = {
  success: (message) => addToastFn?.({ type: 'success', message }),
  error: (message) => addToastFn?.({ type: 'error', message }),
  info: (message) => addToastFn?.({ type: 'info', message })
};

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info
};

const COLORS = {
  success: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', icon: 'var(--accent-green)' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', icon: 'var(--accent-red)' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', icon: 'var(--accent-blue)' }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type, message }) => {
    const id = ++toastId;
    const text = message?.length > 150 ? message.slice(0, 147) + '...' : message;
    setToasts((prev) => {
      const next = [...prev, { id, type, message: text }];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          const color = COLORS[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              role={t.type === 'error' ? 'alert' : 'status'}
              style={{
                pointerEvents: 'auto',
                background: color.bg,
                border: `1px solid ${color.border}`,
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: '280px',
                maxWidth: '400px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            >
              <Icon size={18} color={color.icon} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
