import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Percent, Settings, Monitor } from 'lucide-react';
import TabBar from '../components/TabBar.jsx';
import FormField, { FormInput, FormSelect, SubmitButton } from '../components/FormField.jsx';
import RefreshButton from '../components/RefreshButton.jsx';
import { toast } from '../components/Toast.jsx';
import { settingsStore } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';

const TABS = [
  { key: 'fulfillment', label: 'Fulfillment' },
  { key: 'commissions', label: 'Commissions' }
];

export default function ConfigurationPage() {
  const { settings, loading, saving } = useStore(settingsStore);
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('fulfillment');

  useEffect(() => { settingsStore.load().then((r) => setForm(r.data || {})).catch(() => {}); }, []);
  useEffect(() => { setForm(settings || {}); }, [settings]);

  const refreshSettings = async () => {
    const result = await settingsStore.load({ force: true }).catch((err) => {
      toast.error(err?.message || 'Failed to refresh');
      return null;
    });
    if (result?.data) setForm(result.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await settingsStore.update(form); toast.success('Configuration saved'); }
    catch (err) { toast.error(err?.message || 'Failed to save'); }
  };

  if (loading && !Object.keys(form).length) {
    return <div style={{ maxWidth: '700px' }}><div className="glass-card" style={{ padding: '32px', height: '300px' }}><div style={{ height: '20px', width: '40%', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} /></div></div>;
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={22} color="var(--accent-blue)" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700' }}>System Configuration</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Manage workflows and commissions</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <RefreshButton onClick={refreshSettings} loading={loading} title="Refresh configuration" />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'fulfillment' && (
          <>
            <SectionHeader icon={Monitor} color="var(--accent-blue)" title="Fulfillment Workflow" subtitle="How accepted driver orders are processed" />
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit}>
                <SettingRow label="Accepted Request Handling" description="Choose the method for fulfilling approved stock requests">
                  <FormSelect value={form.accepted_request_fulfillment_mode || 'both'} onChange={(v) => setForm({ ...form, accepted_request_fulfillment_mode: v })} options={[{ value: 'print', label: 'Print order only' }, { value: 'driver_portal', label: 'Driver portal only' }, { value: 'both', label: 'Print + Driver portal' }]} />
                </SettingRow>
                <Divider />
                <SubmitButton loading={saving}><Save size={16} /> Save</SubmitButton>
              </form>
            </div>
          </>
        )}

        {activeTab === 'commissions' && (
          <>
            <SectionHeader icon={Percent} color="var(--accent-green)" title="Commissions & Incentives" subtitle="Automated driver commission calculation" />
            <div style={{ padding: '24px' }}>
              <form onSubmit={handleSubmit}>
                <SettingRow label="Commission Calculation" description="Enable automatic commission calculation">
                  <ToggleSwitch value={form.commissions_enabled === 'true'} onChange={(v) => setForm({ ...form, commissions_enabled: v ? 'true' : 'false' })} />
                </SettingRow>
                {form.commissions_enabled === 'true' && (
                  <>
                    <SettingRow label="Calculation Period" description="How often commissions are calculated">
                      <FormSelect value={form.commission_period || 'monthly'} onChange={(v) => setForm({ ...form, commission_period: v })} options={[{ value: 'monthly', label: 'Monthly' }]} />
                    </SettingRow>
                    <SettingRow label="Eligible Sales Source" description="Which status counts toward commission">
                      <FormSelect value={form.commission_source_status || 'completed'} onChange={(v) => setForm({ ...form, commission_source_status: v })} options={[{ value: 'completed', label: 'Completed requests only' }]} />
                    </SettingRow>
                  </>
                )}
                <Divider />
                <SubmitButton loading={saving}><Save size={16} /> Save</SubmitButton>
              </form>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function SectionHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, color-mix(in srgb, ${color} 6%, transparent) 0%, rgba(0,0,0,0) 100%)`, borderBottom: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={color} /></div>
        <div><h2 style={{ fontSize: '16px', fontWeight: '600' }}>{title}</h2><p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{subtitle}</p></div>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1', minWidth: '200px' }}><div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>{label}</div>{description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>}</div>
      <div style={{ minWidth: '220px', maxWidth: '300px', width: '100%' }}>{children}</div>
    </div>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{ width: '52px', height: '28px', borderRadius: '14px', border: 'none', background: value ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.25s ease', boxShadow: value ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '27px' : '3px', transition: 'left 0.25s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

function Divider() { return <div style={{ borderTop: '1px solid var(--glass-border)', margin: '20px 0' }} />; }
