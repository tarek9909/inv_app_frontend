import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, Truck, Users, Activity, FileText, BarChart3, UserCog, Settings, ClipboardList, Bell, CheckCheck, Menu, X, Sun, Moon } from 'lucide-react';
import { authStore, notificationStore } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';
import { useTheme } from '../hooks/useTheme.js';
import { motion, AnimatePresence } from 'framer-motion';
import FormField, { FormInput, SubmitButton } from '../components/FormField.jsx';
import { toast } from '../components/Toast.jsx';

export default function DashboardLayout() {
  const { user } = useStore(authStore);
  const notificationState = useStore(notificationStore);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Inventory', path: '/dashboard/inventory', icon: Package, permission: 'inventory.view' },
    { label: 'Fleet & Dispatch', path: '/dashboard/fleet', icon: Truck, permission: 'fleet.view' },
    { label: 'Driver Portal', path: '/dashboard/driver', icon: ClipboardList, permission: 'driver_portal.view' },
    { label: 'Team', path: '/dashboard/team', icon: Users, permission: 'team.view' },
    { label: 'Configuration', path: '/dashboard/configuration', icon: Settings, permission: 'settings.manage' },
    { label: 'Audit Logs', path: '/dashboard/audit', icon: Activity, permission: 'audit_logs.view' },
    { label: 'Reports', path: '/dashboard/reports', icon: BarChart3, permission: 'reports.view' },
    { label: 'Profile', path: '/dashboard/profile', icon: UserCog }
  ];

  const canAccess = (item, currentUser = user) => !item.permission || currentUser.role?.code === 'admin' || (currentUser.permissions || []).includes(item.permission);
  const defaultPathFor = (currentUser) => navItems.find((item) => canAccess(item, currentUser))?.path || '/';

  useEffect(() => {
    if (!user) {
      authStore.loadCurrentUser().then((loadedUser) => {
        if (!loadedUser) navigate('/');
      }).catch(() => navigate('/'));
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && canAccess({ permission: 'notifications.view' })) {
      notificationStore.load({ limit: 20 }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const activeItem = navItems.find((item) => location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)));
    if (activeItem && !canAccess(activeItem)) {
      navigate(defaultPathFor(user), { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    authStore.logout();
    navigate('/');
  };

  if (!user) return null;

  if (user.must_change_password) return <ForcedPasswordChange onLogout={handleLogout} />;

  const activeItem = navItems.find((item) => location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)));
  if (activeItem && !canAccess(activeItem)) return null;

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', padding: '20px', gap: '24px' }}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              zIndex: 999
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`glass-panel dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Stock Driver</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Logistics System</p>
          </div>
          {/* Close button for mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ display: 'none', background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {navItems.filter(item => canAccess(item)).map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: isActive ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.32)' : '1px solid transparent'
                }}
              >
                <item.icon size={20} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
                <span style={{ fontWeight: isActive ? '500' : '400' }}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.role?.name}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', flexShrink: 0 }}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="dashboard-main"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}
      >
        <header className="glass-panel dashboard-header" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger menu button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', width: '38px', height: '38px', borderRadius: '10px', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={18} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '600' }}>{navItems.find(i => location.pathname === i.path || (i.path !== '/dashboard' && location.pathname.startsWith(i.path)))?.label || 'Dashboard'}</h1>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {canAccess({ permission: 'notifications.view' }) && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setNotificationsOpen(!notificationsOpen)} title="Notifications" style={{ position: 'relative', background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', width: '38px', height: '38px', borderRadius: '10px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <Bell size={18} />
                  {(notificationState.rows || []).filter((n) => !n.read_at).length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '999px', background: 'var(--accent-red)', color: 'white', fontSize: '11px', display: 'grid', placeItems: 'center' }}>{(notificationState.rows || []).filter((n) => !n.read_at).length}</span>}
                </button>
                {notificationsOpen && <NotificationDrawer rows={notificationState.rows || []} onMarkAll={() => notificationStore.markAllRead().catch(() => {})} onClose={() => setNotificationsOpen(false)} />}
              </div>
            )}
            <div className="header-welcome" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Welcome back, {user.full_name.split(' ')[0]}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NotificationDrawer({ rows, onMarkAll, onClose }) {
  return (
    <>
      {/* Mobile backdrop for notifications */}
      <div className="show-tablet-only" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 19 }} />
      <div className="glass-card notification-drawer" style={{ position: 'absolute', right: 0, top: '46px', width: '360px', maxHeight: '440px', overflow: 'auto', zIndex: 20, padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '14px' }}>Notifications</strong>
          <button onClick={onMarkAll} title="Mark all read" style={{ background: 'transparent', border: 0, color: 'var(--accent-blue)', cursor: 'pointer' }}><CheckCheck size={17} /></button>
        </div>
        {rows.length ? rows.map((row) => (
          <div key={row.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', background: row.read_at ? 'transparent' : 'rgba(59,130,246,0.06)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{row.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{row.message}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{row.created_at ? new Date(row.created_at).toLocaleString() : ''}</div>
          </div>
        )) : <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No notifications</div>}
      </div>
    </>
  );
}

function ForcedPasswordChange({ onLogout }) {
  const [form, setForm] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await authStore.changePassword(form);
      toast.success('Password changed');
    } catch (error) {
      toast.error(error?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>Change password</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px' }}>An administrator issued a temporary password for this account.</p>
        <form onSubmit={submit}>
          <FormField label="Temporary password" required><FormInput type="password" value={form.current_password} onChange={(v) => setForm({ ...form, current_password: v })} /></FormField>
          <FormField label="New password" required><FormInput type="password" value={form.new_password} onChange={(v) => setForm({ ...form, new_password: v })} /></FormField>
          <SubmitButton loading={saving}>Update password</SubmitButton>
        </form>
        <button onClick={onLogout} style={{ marginTop: '12px', background: 'transparent', border: 0, color: 'var(--text-secondary)', cursor: 'pointer' }}>Sign out</button>
      </div>
    </div>
  );
}
