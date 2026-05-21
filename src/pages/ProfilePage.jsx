import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, Shield, Mail, Phone } from 'lucide-react';
import TabBar from '../components/TabBar.jsx';
import FormField, { FormInput, SubmitButton } from '../components/FormField.jsx';
import RefreshButton from '../components/RefreshButton.jsx';
import { toast } from '../components/Toast.jsx';
import { authStore } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'security', label: 'Security' }
];

export default function ProfilePage() {
  const { user, loading } = useStore(authStore);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const refreshProfile = async () => {
    const refreshed = await authStore.loadCurrentUser().catch((err) => {
      toast.error(err?.message || 'Failed to refresh profile');
      return null;
    });
    if (refreshed) {
      setProfile({ full_name: refreshed.full_name || '', email: refreshed.email || '', phone: refreshed.phone || '' });
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profile.full_name.trim()) errs.full_name = 'Name is required';
    if (!profile.email.trim()) errs.email = 'Email is required';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    try { await authStore.updateProfile(profile); toast.success('Profile updated'); }
    catch (err) { toast.error(err?.message || 'Failed to update profile'); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwords.current_password) errs.current_password = 'Required';
    if (!passwords.new_password || passwords.new_password.length < 6) errs.new_password = 'Min 6 characters';
    if (passwords.new_password !== passwords.confirm_password) errs.confirm_password = 'Passwords do not match';
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }
    try {
      await authStore.changePassword({ current_password: passwords.current_password, new_password: passwords.new_password });
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed');
    } catch (err) { toast.error(err?.message || 'Failed to change password'); }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: 'var(--accent-blue)' }}>
            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700' }}>{user?.full_name || 'My Account'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user?.email} • {user?.role?.name || 'User'}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <RefreshButton onClick={refreshProfile} loading={loading} title="Refresh profile" />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'profile' && (
          <>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%)', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color="var(--accent-blue)" /></div>
                <div><h2 style={{ fontSize: '16px', fontWeight: '600' }}>Personal Information</h2><p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Update your name, email, and phone number</p></div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={saveProfile}>
                <FormField label="Full Name" required error={profileErrors.full_name}>
                  <FormInput value={profile.full_name} onChange={(v) => { setProfile({ ...profile, full_name: v }); setProfileErrors({}); }} placeholder="Your name" />
                </FormField>
                <FormField label="Email Address" required error={profileErrors.email}>
                  <FormInput type="email" value={profile.email} onChange={(v) => { setProfile({ ...profile, email: v }); setProfileErrors({}); }} placeholder="you@example.com" />
                </FormField>
                <FormField label="Phone Number">
                  <FormInput value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="Optional" />
                </FormField>

                {/* Read-only info */}
                <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Details</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Role:</span> <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{user?.role?.name || '—'}</span></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span style={{ color: 'var(--accent-green)', fontWeight: '500' }}>{user?.status || '—'}</span></div>
                  </div>
                </div>

                <SubmitButton loading={loading}>Save Profile</SubmitButton>
              </form>
            </div>
          </>
        )}

        {activeTab === 'security' && (
          <>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(239, 68, 68, 0.03) 100%)', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={18} color="var(--accent-purple)" /></div>
                <div><h2 style={{ fontSize: '16px', fontWeight: '600' }}>Change Password</h2><p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Update your account password</p></div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <form onSubmit={changePassword}>
                <FormField label="Current Password" required error={passwordErrors.current_password}>
                  <FormInput type="password" value={passwords.current_password} onChange={(v) => { setPasswords({ ...passwords, current_password: v }); setPasswordErrors({}); }} placeholder="Enter current password" />
                </FormField>
                <FormField label="New Password" required error={passwordErrors.new_password}>
                  <FormInput type="password" value={passwords.new_password} onChange={(v) => { setPasswords({ ...passwords, new_password: v }); setPasswordErrors({}); }} placeholder="Min 6 characters" />
                </FormField>
                <FormField label="Confirm New Password" required error={passwordErrors.confirm_password}>
                  <FormInput type="password" value={passwords.confirm_password} onChange={(v) => { setPasswords({ ...passwords, confirm_password: v }); setPasswordErrors({}); }} placeholder="Repeat new password" />
                </FormField>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-orange)', fontSize: '12px', marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <AlertCircle size={14} />
                  Password changes apply immediately. You will stay logged in.
                </div>

                <SubmitButton loading={loading}>Change Password</SubmitButton>
              </form>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
