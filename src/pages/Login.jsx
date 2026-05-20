import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, KeyRound, Mail, AlertCircle, Sun, Moon } from 'lucide-react';
import { authStore } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';
import { useTheme } from '../hooks/useTheme.js';

const defaultPathForUser = (user) => {
  const permissions = user?.permissions || [];
  const has = (permission) => user?.role?.code === 'admin' || permissions.includes(permission);
  if (has('dashboard.view')) return '/dashboard';
  if (has('inventory.view')) return '/dashboard/inventory';
  if (has('fleet.view')) return '/dashboard/fleet';
  if (has('driver_portal.view')) return '/dashboard/driver';
  if (has('team.view')) return '/dashboard/team';
  return '/dashboard';
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error } = useStore(authStore);
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await authStore.login({ email, password });
      navigate(defaultPathForUser(result.data?.user));
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', position: 'relative' }}>
      {/* Theme toggle on login page */}
      <button
        onClick={toggleTheme}
        className="theme-toggle-btn"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ position: 'absolute', top: '20px', right: '20px' }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-panel login-panel"
        style={{ width: '100%', maxWidth: '420px', padding: '40px 30px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 16px' 
          }}>
            <LogIn size={32} color="var(--accent-blue)" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to Stock Driver System</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
              padding: '12px 16px', borderRadius: '12px', color: '#fca5a5', marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
            }}
          >
            <AlertCircle size={18} />
            {error?.message || 'Invalid credentials'}
          </motion.div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '44px' }}
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '44px' }}
                placeholder="********"
                required
              />
            </div>
          </div>

          <button type="submit" className="glass-button" disabled={loading} style={{ marginTop: '12px', width: '100%' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
