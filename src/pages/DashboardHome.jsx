import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, Truck, ClipboardList, DollarSign, RefreshCw, TrendingUp, ArrowRight, CreditCard, ShoppingCart, Calendar } from 'lucide-react';
import { reportStore, inventoryStores, accountantStores, authStore } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';
import { StatusBadge } from '../components/DataTable.jsx';

const METRICS = [
  { key: 'total_items', label: 'Total Items', icon: Package, color: 'var(--accent-blue)' },
  { key: 'low_stock_items', label: 'Low Stock', icon: AlertTriangle, color: 'var(--accent-orange)' },
  { key: 'active_drivers', label: 'Active Drivers', icon: Truck, color: 'var(--accent-green)' },
  { key: 'pending_stock_requests', label: 'Pending Requests', icon: ClipboardList, color: 'var(--accent-purple)' },
  { key: 'unpaid_requests', label: 'Unpaid', icon: DollarSign, color: 'var(--accent-red)' }
];

export default function DashboardHome() {
  const { dashboard, loading, error } = useStore(reportStore);
  const { user } = useStore(authStore);
  const itemsState = useStore(inventoryStores.items);
  const requestsState = useStore(accountantStores.stockRequests);
  const paymentsState = useStore(accountantStores.payments);
  const navigate = useNavigate();

  useEffect(() => {
    reportStore.loadDashboard().catch(() => {});
    inventoryStores.items.load({ limit: 5 }).catch(() => {});
    accountantStores.stockRequests.load({ limit: 5 }).catch(() => {});
    accountantStores.payments.load({ limit: 5 }).catch(() => {});
  }, []);

  const lowStockItems = (itemsState.rows || []).filter((i) => i.current_stock <= (i.minimum_stock || 0)).slice(0, 5);
  const recentRequests = (requestsState.rows || []).slice(0, 5);
  const recentPayments = (paymentsState.rows || []).slice(0, 5);

  if (error && !dashboard) {
    return (
      <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
        <AlertTriangle size={32} color="var(--accent-red)" style={{ marginBottom: '16px' }} />
        <h3 style={{ marginBottom: '8px' }}>Failed to load dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>{error?.message || 'Something went wrong'}</p>
        <button onClick={() => reportStore.loadDashboard()} className="glass-button" style={{ display: 'inline-flex' }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Refresh button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => { reportStore.loadDashboard(); inventoryStores.items.load({ limit: 5 }); accountantStores.stockRequests.load({ limit: 5 }); accountantStores.payments.load({ limit: 5 }); }}
          disabled={loading}
          title="Refresh dashboard"
          className="refresh-btn"
          style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '36px', height: '36px', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: loading ? 0.5 : 1 }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>
      {/* Metrics Row */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {METRICS.map((metric, idx) => {
          const Icon = metric.icon;
          const value = dashboard?.[metric.key];
          return (
            <motion.div key={metric.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card metric-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="metric-label" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{metric.label}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `color-mix(in srgb, ${metric.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={metric.color} />
                </div>
              </div>
              {loading || value === undefined ? (
                <div style={{ height: '28px', width: '70px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
              ) : (
                <div className="metric-value" style={{ fontSize: '26px', fontWeight: '700' }}>{value?.toLocaleString?.() ?? value}</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Recent Stock Requests */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList size={16} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Recent Stock Requests</h3>
            </div>
            <button onClick={() => navigate('/dashboard/fleet')} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>View all <ArrowRight size={12} /></button>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {requestsState.loading ? (
              <LoadingSkeleton />
            ) : recentRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No recent requests</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentRequests.map((req) => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={14} color="var(--accent-purple)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{req.request_number}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.driver?.full_name || '-'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>${Number(req.total_amount || 0).toFixed(2)}</span>
                      <StatusBadge status={req.request_status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={16} color="var(--accent-orange)" />
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Low Stock Alerts</h3>
            </div>
            <button onClick={() => navigate('/dashboard/inventory')} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>View all <ArrowRight size={12} /></button>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {itemsState.loading ? (
              <LoadingSkeleton />
            ) : lowStockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <TrendingUp size={24} color="var(--accent-green)" style={{ marginBottom: '8px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>All items are well stocked</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={14} color="var(--accent-red)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.sku || 'No SKU'}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-red)' }}>{item.current_stock}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>min: {item.minimum_stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Payments */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={16} color="var(--accent-green)" />
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Recent Payments</h3>
            </div>
            <button onClick={() => navigate('/dashboard/fleet')} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>View all <ArrowRight size={12} /></button>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {paymentsState.loading ? (
              <LoadingSkeleton />
            ) : recentPayments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No recent payments</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentPayments.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={14} color="var(--accent-green)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{p.payment_number || `#${p.id}`}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.stock_request?.driver?.full_name || p.driver?.full_name || '-'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-green)' }}>${Number(p.amount || 0).toFixed(2)}</span>
                      <StatusBadge status={p.payment_method} colorMap={{ cash: 'var(--accent-green)', bank_transfer: 'var(--accent-blue)', other: 'var(--accent-purple)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={16} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Quick Actions</h3>
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="quick-actions-grid">
            <QuickAction icon={ClipboardList} label="New Stock Request" color="var(--accent-purple)" onClick={() => navigate('/dashboard/fleet')} />
            <QuickAction icon={Package} label="Manage Inventory" color="var(--accent-blue)" onClick={() => navigate('/dashboard/inventory')} />
            <QuickAction icon={CreditCard} label="Record Payment" color="var(--accent-green)" onClick={() => navigate('/dashboard/fleet')} />
            <QuickAction icon={ShoppingCart} label="Purchase Orders" color="var(--accent-orange)" onClick={() => navigate('/dashboard/inventory')} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{label}</span>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3].map((i) => <div key={i} style={{ height: '48px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  );
}
