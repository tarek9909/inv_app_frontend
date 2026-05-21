import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, CreditCard, ShoppingCart, RefreshCw, AlertTriangle, Target, DollarSign, Calendar, FileText, MapPin, Package, Download, Filter, X } from 'lucide-react';
import TabBar from '../components/TabBar.jsx';
import Pagination, { useClientPagination } from '../components/Pagination.jsx';
import { reportStore } from '../state/index.js';
import { getApiConfig, tokenStorage, buildQuery } from '../api/index.js';
import { useStore } from '../hooks/useStore.js';
import { StatusBadge } from '../components/DataTable.jsx';
import CustomSelect from '../components/CustomSelect.jsx';
import RefreshButton from '../components/RefreshButton.jsx';

const TABS = [
  { key: 'payroll', label: 'Payroll' },
  { key: 'drivers', label: 'Driver Reports' },
  { key: 'location-kpis', label: 'Location KPIs' },
  { key: 'driver-kpis', label: 'Driver KPIs' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'balances', label: 'Balances' },
  { key: 'missing', label: 'Missing Payments' },
  { key: 'commissions', label: 'Commissions' },
  { key: 'payments', label: 'Payments' },
  { key: 'purchases', label: 'Purchases' }
];

export default function ReportsPage() {
  const state = useStore(reportStore);
  const { inventorySummary, driverBalances, paymentSummary, missingPayments, purchaseSummary, commissionSummary, targetKpis, driverPayroll, driverDetailReports, driverDetailReport, loadingByKey = {}, error } = state;
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('payroll');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const printRef = useRef(null);

  const filteredPayments = useMemo(() => {
    if (!paymentSummary || !Array.isArray(paymentSummary)) return [];
    let result = paymentSummary;
    if (startDate) result = result.filter((p) => (p.date || p.payment_date || '') >= startDate);
    if (endDate) result = result.filter((p) => (p.date || p.payment_date || '') <= endDate);
    return result;
  }, [paymentSummary, startDate, endDate]);

  const loadAll = (month = reportMonth) => {
    reportStore.loadInventorySummary().catch(() => {});
    reportStore.loadDriverBalances().catch(() => {});
    reportStore.loadPaymentSummary().catch(() => {});
    reportStore.loadMissingPayments({ month }).catch(() => {});
    reportStore.loadPurchaseSummary().catch(() => {});
    reportStore.loadCommissionSummary({ month }).catch(() => {});
    reportStore.loadTargetKpis({ month }).catch(() => {});
    reportStore.loadDriverPayroll({ month }).catch(() => {});
    reportStore.loadDriverDetailReports({ month }).catch(() => {});
  };

  useEffect(() => { loadAll(reportMonth); }, [reportMonth]);
  useEffect(() => {
    if (!selectedDriverId) { reportStore.clearDriverDetailReport(); return; }
    reportStore.loadDriverDetailReport(selectedDriverId, { month: reportMonth }).catch(() => {});
  }, [selectedDriverId, reportMonth]);

  const exportPDF = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!sections.length) { exportPDF(); return; }
    const tabLabel = TABS.find((t) => t.key === activeTab)?.label || 'Report';
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${tabLabel} - Stock Driver Report</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1a1a2e; font-size: 13px; }
      h1 { font-size: 22px; margin-bottom: 4px; color: #0f172a; }
      h2 { font-size: 16px; margin-bottom: 12px; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
      td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
      tr:nth-child(even) { background: #fafbfc; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
      .green { background: #dcfce7; color: #166534; }
      .orange { background: #fef3c7; color: #92400e; }
      .red { background: #fee2e2; color: #991b1b; }
      .blue { background: #dbeafe; color: #1e40af; }
      .bold { font-weight: 700; }
      .right { text-align: right; }
      .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
      @media print { body { padding: 20px; } }
    </style></head><body>`);
    printWindow.document.write(`<h1>Stock Driver System</h1>`);
    printWindow.document.write(`<div class="meta">${tabLabel} Report • Period: ${reportMonth} • Generated: ${new Date().toLocaleString()}</div>`);
    printWindow.document.write(content.innerHTML);
    printWindow.document.write(`<div class="footer"><span>Stock Driver System</span><span>Page 1</span></div>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const exportReportPDF = (scope = 'active') => {
    const sections = buildReportPdfSections({
      activeTab,
      selectedDriverId,
      reportMonth,
      startDate,
      endDate,
      inventorySummary,
      driverBalances,
      paymentSummary: filteredPayments,
      missingPayments,
      purchaseSummary,
      commissionSummary,
      targetKpis,
      driverPayroll,
      driverDetailReports,
      driverDetailReport
    }).filter((section) => scope === 'full' || section.key === activeTab);
    const tabLabel = TABS.find((t) => t.key === activeTab)?.label || 'Report';
    openReportPdfWindow({
      title: scope === 'full' ? 'Full Reports Pack' : `${tabLabel} Report`,
      subtitle: [
        `Period: ${reportMonth}`,
        startDate || endDate ? `Date filter: ${startDate || 'Start'} to ${endDate || 'End'}` : '',
        `Generated: ${new Date().toLocaleString()}`
      ].filter(Boolean).join(' | '),
      sections
    });
  };

  const exportCSV = () => {
    const endpoints = {
      inventory: '/reports/inventory-summary',
      balances: '/reports/driver-balances',
      payments: '/reports/payment-summary',
      purchases: '/reports/purchase-summary',
      commissions: '/reports/commission-summary',
      'location-kpis': '/reports/target-kpis',
      'driver-kpis': '/reports/target-kpis',
      payroll: '/reports/driver-payroll',
      drivers: selectedDriverId ? `/reports/drivers/${selectedDriverId}/statement` : '/reports/driver-statements',
      missing: '/reports/missing-payments'
    };
    const endpoint = endpoints[activeTab] || '/reports/inventory-summary';
    const params = { format: 'csv', month: reportMonth, start_date: startDate, end_date: endDate };
    const url = `${getApiConfig().baseUrl}${endpoint}${buildQuery(params)}`;
    fetch(url, { headers: { Authorization: `Bearer ${tokenStorage.get()}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${activeTab}-report.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  };

  if (error && !inventorySummary && !driverBalances) {
    return (
      <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
        <AlertTriangle size={32} color="var(--accent-red)" style={{ marginBottom: '16px' }} />
        <h3 style={{ marginBottom: '8px' }}>Failed to load reports</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>{error?.message || 'Something went wrong'}</p>
        <button onClick={() => loadAll()} className="glass-button" style={{ display: 'inline-flex' }}><RefreshCw size={16} /> Retry</button>
      </div>
    );
  }

  const hasFilters = startDate || endDate;
  const reportsLoading = Object.values(loadingByKey).some(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Premium Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Reports & Analytics</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Period: <strong style={{ color: 'var(--text-primary)' }}>{reportMonth}</strong>
                {driverPayroll?.payout_date && <> • Payout: <strong style={{ color: 'var(--accent-green)' }}>{driverPayroll.payout_date}</strong></>}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshButton onClick={() => loadAll()} loading={reportsLoading} title="Refresh reports" />
              <button onClick={() => setFiltersOpen(!filtersOpen)} style={{ background: filtersOpen || hasFilters ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${hasFilters ? 'rgba(59, 130, 246, 0.4)' : 'var(--glass-border)'}`, color: hasFilters ? 'var(--accent-blue)' : 'var(--text-secondary)', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                <Filter size={14} /> Filters {hasFilters && '•'}
              </button>
              <button onClick={() => exportReportPDF('active')} className="glass-button" style={{ fontSize: '13px', padding: '8px 14px' }}>
                <Download size={14} /> Active View PDF
              </button>
              <button onClick={() => exportReportPDF('full')} className="glass-button" style={{ fontSize: '13px', padding: '8px 14px' }}>
                <Download size={14} /> Full PDF
              </button>
              <button onClick={exportCSV} className="glass-button" style={{ fontSize: '13px', padding: '8px 14px' }}>
                <Download size={14} /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {filtersOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ borderTop: '1px solid var(--glass-border)', padding: '16px 24px', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Month</label>
                <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="glass-input" style={{ width: '160px', padding: '8px 12px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass-input" style={{ width: '150px', padding: '8px 12px', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="glass-input" style={{ width: '150px', padding: '8px 12px', fontSize: '13px' }} />
              </div>
              {hasFilters && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <X size={12} /> Clear Dates
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Tabs */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div ref={printRef}>
        {activeTab === 'payroll' && <PayrollTab data={driverPayroll} loading={loadingByKey.driverPayroll && !driverPayroll} />}
        {activeTab === 'drivers' && <DriverReportsTab overview={driverDetailReports} detail={driverDetailReport} selectedDriverId={selectedDriverId} onSelectDriver={setSelectedDriverId} loading={loadingByKey.driverDetailReports && !driverDetailReports} />}
        {activeTab === 'location-kpis' && <LocationKpisTab data={targetKpis} loading={loadingByKey.targetKpis && !targetKpis} />}
        {activeTab === 'driver-kpis' && <DriverKpisTab data={targetKpis} loading={loadingByKey.targetKpis && !targetKpis} />}
        {activeTab === 'inventory' && <InventoryTab data={inventorySummary} loading={loadingByKey.inventorySummary && !inventorySummary} />}
        {activeTab === 'balances' && <BalancesTab data={driverBalances} loading={loadingByKey.driverBalances && !driverBalances} />}
        {activeTab === 'missing' && <MissingTab data={missingPayments} loading={loadingByKey.missingPayments && !missingPayments} />}
        {activeTab === 'commissions' && <CommissionsTab data={commissionSummary} loading={loadingByKey.commissionSummary && !commissionSummary} />}
        {activeTab === 'payments' && <PaymentSummaryTab data={filteredPayments} loading={loadingByKey.paymentSummary && !paymentSummary} startDate={startDate} endDate={endDate} />}
        {activeTab === 'purchases' && <PurchasesTab data={purchaseSummary} loading={loadingByKey.purchaseSummary && !purchaseSummary} />}
      </div>
    </div>
  );
}

function PayrollTab({ data, loading }) {
  const rows = data?.rows || [];
  const pagination = useClientPagination(rows, 15);
  const totals = useMemo(() => ({
    salary: rows.reduce((s, r) => s + Number(r.salary || 0), 0),
    commission: rows.reduce((s, r) => s + Number(r.total_commission || 0), 0),
    pay: rows.reduce((s, r) => s + Number(r.total_pay || 0), 0)
  }), [rows]);

  return (
    <ReportSection title="Driver Monthly Payroll" icon={DollarSign} loading={loading} summary={rows.length > 0 && (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SummaryChip label="Total Salary" value={`$${totals.salary.toFixed(2)}`} color="var(--text-primary)" />
        <SummaryChip label="Total Commission" value={`$${totals.commission.toFixed(2)}`} color="var(--accent-blue)" />
        <SummaryChip label="Total Payout" value={`$${totals.pay.toFixed(2)}`} color="var(--accent-green)" />
      </div>
    )}>
      {pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Driver', 'Location', 'Salary', 'Sales', 'Orders', 'Target', 'KPI', 'Commission', 'Total Pay'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((row) => (
                  <tr key={row.driver_id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td bold>{row.driver_name}</Td>
                    <Td secondary>{row.performance_locations?.join(', ') || row.current_location_name || '—'}</Td>
                    <Td>${money(row.salary)}</Td>
                    <Td>${money(row.sales_total)}</Td>
                    <Td>{row.order_count || 0}</Td>
                    <Td>${money(row.target_amount)}</Td>
                    <Td><StatusBadge status={row.performance} colorMap={{ target_reached: 'var(--accent-green)', on_track: 'var(--accent-blue)', behind: 'var(--accent-orange)', no_target: 'var(--text-muted)', active_no_target: 'var(--accent-blue)' }} /> <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{percent(row.progress_percent)}</span></Td>
                    <Td>${money(row.total_commission)}</Td>
                    <Td bold color="var(--accent-green)">${money(row.total_pay)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="drivers" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function DriverReportsTab({ overview, detail, selectedDriverId, onSelectDriver, loading }) {
  const rows = overview?.rows || [];
  const report = detail?.report || null;
  const driverOptions = rows.map((row) => ({ value: row.driver.id, label: row.driver.full_name }));
  const pagination = useClientPagination(rows, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ReportSection title="Driver Report Overview" icon={Users} loading={loading}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '260px', width: '100%' }}>
            <CustomSelect value={selectedDriverId} onChange={(v) => onSelectDriver(v)} options={driverOptions} placeholder="All drivers" />
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Period: {overview?.period || '—'}</span>
        </div>
        {pagination.items.length ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Driver', 'Location', 'Requests', 'Net Sales', 'Paid', 'Missing', 'Target', 'Progress', 'Commission', 'Total Pay'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {pagination.items.map((row) => (
                    <tr key={row.driver.id} onClick={() => onSelectDriver(String(row.driver.id))} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: String(row.driver.id) === String(selectedDriverId) ? 'rgba(59,130,246,0.06)' : 'transparent' }}>
                      <Td bold>{row.driver.full_name}</Td>
                      <Td secondary>{row.driver.current_location?.name || '—'}</Td>
                      <Td>{row.summary.request_count}</Td>
                      <Td>${money(row.summary.net_sales)}</Td>
                      <Td>${money(row.summary.paid_in_period)}</Td>
                      <Td bold color={row.summary.missing_payments > 0 ? 'var(--accent-orange)' : 'var(--accent-green)'}>${money(row.summary.missing_payments)}</Td>
                      <Td>${money(row.kpi.target_amount)}</Td>
                      <Td><StatusBadge status={row.kpi.performance} colorMap={{ target_reached: 'var(--accent-green)', on_track: 'var(--accent-blue)', behind: 'var(--accent-orange)', no_target: 'var(--text-muted)', active_no_target: 'var(--accent-blue)' }} /> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{percent(row.kpi.progress_percent)}</span></Td>
                      <Td>${money(row.commission.total_commission)}</Td>
                      <Td bold color="var(--accent-green)">${money(row.payroll.total_pay)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="drivers" />
          </>
        ) : <EmptyState />}
      </ReportSection>
      {selectedDriverId && (report ? <DriverReportDetail report={report} /> : <ReportSection title="Driver Detail" icon={FileText} loading><EmptyState /></ReportSection>)}
    </div>
  );
}

function DriverReportDetail({ report }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ReportSection title={`${report.driver.full_name} — Summary`} icon={FileText}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <Metric label="Location" value={report.driver.current_location?.name || '—'} />
          <Metric label="Requests" value={report.summary.request_count} />
          <Metric label="Net Sales" value={`$${money(report.summary.net_sales)}`} tone="green" />
          <Metric label="Missing" value={`$${money(report.summary.missing_payments)}`} tone={report.summary.missing_payments > 0 ? 'orange' : 'green'} />
          <Metric label="Progress" value={percent(report.kpi.progress_percent)} />
          <Metric label="Total Pay" value={`$${money(report.payroll.total_pay)}`} tone="green" />
        </div>
      </ReportSection>
      <ReportSection title="Stock Requests" icon={FileText}>
        <SimpleTable columns={['Request', 'Date', 'Type', 'Status', 'Total', 'Paid', 'Remaining']} rows={(report.requests || []).map((r) => [r.request_number, r.request_date || '—', r.request_type?.replace(/_/g, ' '), r.request_status, `$${money(r.total_amount)}`, `$${money(r.paid_amount)}`, `$${money(r.remaining_amount)}`])} />
      </ReportSection>
      <ReportSection title="Payments" icon={CreditCard}>
        <SimpleTable columns={['Payment', 'Request', 'Date', 'Method', 'Amount']} rows={(report.payments || []).map((p) => [p.payment_number, p.request_number || '—', p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—', p.payment_method?.replace(/_/g, ' '), `$${money(p.amount)}`])} />
      </ReportSection>
    </div>
  );
}

function LocationKpisTab({ data, loading }) {
  const rows = data?.locationRows || [];
  const pagination = useClientPagination(rows, 15);
  return (
    <ReportSection title="Location Target KPIs" icon={Target} loading={loading} summary={rows.length > 0 && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Period: {data?.period || '—'} • {rows.length} location{rows.length !== 1 ? 's' : ''}</span>}>
      {pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Location', 'Drivers', 'Mode', 'Target', 'Sales', 'Progress', 'Variance'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((row) => (
                  <tr key={row.location_id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td bold>{row.location_name}</Td>
                    <Td>{row.driver_count}</Td>
                    <Td secondary>{row.target_mode?.replace(/_/g, ' ') || '—'}</Td>
                    <Td>${money(row.target_amount)}</Td>
                    <Td>${money(row.sales_total)}</Td>
                    <Td><StatusBadge status={row.target_reached ? 'completed' : 'pending'} /> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{percent(row.progress_percent)}</span></Td>
                    <Td bold color={Number(row.variance_amount || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}>${money(row.variance_amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="locations" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function DriverKpisTab({ data, loading }) {
  const [locationFilter, setLocationFilter] = useState('');
  const allRows = data?.driverRows || [];
  const filtered = useMemo(() => locationFilter ? allRows.filter((r) => String(r.location_id) === locationFilter) : allRows, [allRows, locationFilter]);
  const pagination = useClientPagination(filtered, 15);
  const locationOptions = useMemo(() => { const seen = new Map(); allRows.forEach((r) => { if (!seen.has(r.location_id)) seen.set(r.location_id, r.location_name); }); return Array.from(seen.entries()).map(([id, name]) => ({ value: String(id), label: name })); }, [allRows]);

  return (
    <ReportSection title="Driver Target KPIs" icon={Users} loading={loading} summary={<span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Period: {data?.period || '—'}</span>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ maxWidth: '220px', width: '100%' }}>
          <CustomSelect value={locationFilter} onChange={(v) => setLocationFilter(v)} options={locationOptions} placeholder="All locations" />
        </div>
      </div>
      {pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Driver', 'Location', 'Target', 'Sales', 'Progress', 'Variance'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((row) => (
                  <tr key={`${row.location_id}-${row.driver_id}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td bold>{row.driver_name}</Td>
                    <Td secondary>{row.location_name}</Td>
                    <Td>${money(row.target_amount)}</Td>
                    <Td>${money(row.sales_total)}</Td>
                    <Td><StatusBadge status={row.target_reached ? 'completed' : 'pending'} /> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{percent(row.progress_percent)}</span></Td>
                    <Td bold color={Number(row.variance_amount || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}>${money(row.variance_amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="drivers" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function InventoryTab({ data, loading }) {
  const rows = data && Array.isArray(data) ? data : [];
  const pagination = useClientPagination(rows, 20);
  return (
    <ReportSection title="Inventory Summary" icon={BarChart3} loading={loading} summary={rows.length > 0 && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{rows.length} items • {rows.filter((i) => i.current_stock <= (i.minimum_stock || 0)).length} low stock</span>}>
      {pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Name', 'SKU', 'Stock', 'Reserved', 'Available', 'Min Stock', 'Status'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((item, idx) => { const low = Number(item.available_stock ?? (item.current_stock || 0)) <= Number(item.minimum_stock || 0); return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td>{item.name}</Td><Td secondary>{item.sku || '—'}</Td>
                    <Td bold color={low ? 'var(--accent-red)' : undefined}>{item.current_stock}</Td>
                    <Td>{item.reserved_stock || 0}</Td>
                    <Td bold color={low ? 'var(--accent-red)' : 'var(--accent-green)'}>{item.available_stock ?? item.current_stock}</Td>
                    <Td>{item.minimum_stock}</Td>
                    <Td>{low ? <StatusBadge status="low stock" colorMap={{ 'low stock': 'var(--accent-red)' }} /> : <StatusBadge status="ok" colorMap={{ ok: 'var(--accent-green)' }} />}</Td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="items" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function BalancesTab({ data, loading }) {
  const rows = data && Array.isArray(data) ? data : [];
  const pagination = useClientPagination(rows, 15);
  const totalBalance = useMemo(() => rows.reduce((s, d) => s + Number(d.balance || d.remaining_amount || 0), 0), [rows]);
  return (
    <ReportSection title="Driver Balances" icon={Users} loading={loading} summary={rows.length > 0 && <SummaryChip label="Total Outstanding" value={`$${totalBalance.toFixed(2)}`} color="var(--accent-orange)" />}>
      {pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Driver', 'Phone', 'Status', 'Balance'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td>{d.full_name}</Td><Td secondary>{d.phone || '—'}</Td>
                    <Td><StatusBadge status={d.status} /></Td>
                    <Td bold color={Number(d.balance || d.remaining_amount || 0) > 0 ? 'var(--accent-orange)' : 'var(--accent-green)'}>${Number(d.balance || d.remaining_amount || 0).toFixed(2)}</Td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="drivers" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function MissingTab({ data, loading }) {
  const rows = data?.rows || [];
  const pagination = useClientPagination(rows, 15);
  return (
    <ReportSection title="Missing Payments" icon={CreditCard} loading={loading} summary={data && <SummaryChip label={`Missing (${data.period})`} value={`$${Number(data.total_missing || 0).toFixed(2)}`} color="var(--accent-orange)" />}>
      {pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Request', 'Driver', 'Completed', 'Status', 'Total', 'Paid', 'Missing'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td>{row.request_number}</Td><Td>{row.driver_name}</Td>
                    <Td secondary>{row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}</Td>
                    <Td><StatusBadge status={row.payment_status} /></Td>
                    <Td>${money(row.total_amount)}</Td><Td>${money(row.paid_amount)}</Td>
                    <Td bold color="var(--accent-orange)">${money(row.remaining_amount)}</Td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="requests" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function CommissionsTab({ data, loading }) {
  const rows = data?.rows || [];
  const pagination = useClientPagination(rows, 15);
  const totalCommission = useMemo(() => rows.reduce((s, r) => s + Number(r.total_commission || 0), 0), [rows]);
  return (
    <ReportSection title="Driver Commissions" icon={Users} loading={loading} summary={data?.enabled !== false && rows.length > 0 && <SummaryChip label="Total Commission" value={`$${totalCommission.toFixed(2)}`} color="var(--accent-green)" />}>
      {data?.enabled === false ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Commission calculation is disabled.</p>
      ) : pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Driver', 'Location', 'Sales', 'Target', 'Progress', 'Base', 'Bonus', 'Total'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((row, idx) => (
                  <tr key={`${row.driver_id}-${row.location_id}-${idx}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td bold>{row.driver_name}</Td><Td secondary>{row.location_name}</Td>
                    <Td>${money(row.sales_total)}</Td><Td>${money(row.target_amount)}</Td>
                    <Td><StatusBadge status={row.target_reached ? 'completed' : 'pending'} /> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{percent(row.target_progress_percent)}</span></Td>
                    <Td>${money(row.base_commission)}</Td><Td>${money(row.bonus_commission)}</Td>
                    <Td bold color="var(--accent-green)">${money(row.total_commission)}</Td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="entries" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function PaymentSummaryTab({ data, loading, startDate, endDate }) {
  const pagination = useClientPagination(data, 20);
  const total = useMemo(() => data.reduce((s, p) => s + Number(p.total_amount || p.amount || p.total || 0), 0), [data]);
  return (
    <ReportSection title="Payment Summary" icon={CreditCard} loading={loading} summary={data.length > 0 && (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <SummaryChip label={`${data.length} day${data.length !== 1 ? 's' : ''}${(startDate || endDate) ? ' (filtered)' : ''}`} value={`$${total.toFixed(2)}`} color="var(--accent-green)" />
      </div>
    )}>
      {pagination.items.length ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Date', 'Total Amount'].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {pagination.items.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <Td>{p.date || p.payment_date || '—'}</Td>
                    <Td bold>${Number(p.total_amount || p.amount || p.total || 0).toFixed(2)}</Td>
                  </tr>))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={pagination.setPage} label="days" />
        </>
      ) : <EmptyState />}
    </ReportSection>
  );
}

function PurchasesTab({ data, loading }) {
  const rows = data && Array.isArray(data) ? data : [];
  return (
    <ReportSection title="Purchase Orders by Status" icon={ShoppingCart} loading={loading}>
      {rows.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {rows.map((s, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <StatusBadge status={s.status} />
              <div style={{ marginTop: '16px', fontSize: '32px', fontWeight: '700' }}>{s.count || 0}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>${Number(s.total_amount || s.amount || 0).toFixed(2)}</div>
            </motion.div>
          ))}
        </div>
      ) : <EmptyState />}
    </ReportSection>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function buildReportPdfSections(data) {
  const inventoryRows = Array.isArray(data.inventorySummary) ? data.inventorySummary : [];
  const balanceRows = Array.isArray(data.driverBalances) ? data.driverBalances : [];
  const paymentRows = Array.isArray(data.paymentSummary) ? data.paymentSummary : [];
  const purchaseRows = Array.isArray(data.purchaseSummary) ? data.purchaseSummary : [];
  const missingRows = data.missingPayments?.rows || [];
  const commissionRows = data.commissionSummary?.rows || [];
  const payrollRows = data.driverPayroll?.rows || [];
  const driverRows = data.driverDetailReports?.rows || [];
  const locationKpiRows = data.targetKpis?.locationRows || [];
  const driverKpiRows = data.targetKpis?.driverRows || [];

  return [
    {
      key: 'payroll',
      title: 'Driver Monthly Payroll',
      summary: [['Period', data.driverPayroll?.period || data.reportMonth], ['Drivers', payrollRows.length], ['Total Salary', `$${money(sumBy(payrollRows, 'salary'))}`], ['Total Commission', `$${money(sumBy(payrollRows, 'total_commission'))}`], ['Total Payout', `$${money(sumBy(payrollRows, 'total_pay'))}`]],
      tables: [pdfTable(['Driver', 'Location', 'Salary', 'Sales', 'Orders', 'Target', 'KPI', 'Commission', 'Total Pay'], payrollRows.map((row) => [row.driver_name, row.performance_locations?.join(', ') || row.current_location_name || '-', `$${money(row.salary)}`, `$${money(row.sales_total)}`, row.order_count || 0, `$${money(row.target_amount)}`, `${cleanText(row.performance)} (${percent(row.progress_percent)})`, `$${money(row.total_commission)}`, `$${money(row.total_pay)}`]))]
    },
    {
      key: 'drivers',
      title: data.selectedDriverId && data.driverDetailReport?.report ? `${data.driverDetailReport.report.driver.full_name} Driver Detail` : 'Driver Report Overview',
      summary: [['Period', data.driverDetailReports?.period || data.reportMonth], ['Drivers', driverRows.length], ['Net Sales', `$${money(sumNested(driverRows, ['summary', 'net_sales']))}`], ['Paid', `$${money(sumNested(driverRows, ['summary', 'paid_in_period']))}`], ['Missing', `$${money(sumNested(driverRows, ['summary', 'missing_payments']))}`]],
      tables: buildDriverPdfTables(data.driverDetailReport?.report, driverRows)
    },
    {
      key: 'location-kpis',
      title: 'Location Target KPIs',
      summary: [['Period', data.targetKpis?.period || data.reportMonth], ['Locations', locationKpiRows.length], ['Total Target', `$${money(sumBy(locationKpiRows, 'target_amount'))}`], ['Total Sales', `$${money(sumBy(locationKpiRows, 'sales_total'))}`]],
      tables: [pdfTable(['Location', 'Drivers', 'Mode', 'Target', 'Sales', 'Progress', 'Variance'], locationKpiRows.map((row) => [row.location_name, row.driver_count, cleanText(row.target_mode), `$${money(row.target_amount)}`, `$${money(row.sales_total)}`, percent(row.progress_percent), `$${money(row.variance_amount)}`]))]
    },
    {
      key: 'driver-kpis',
      title: 'Driver Target KPIs',
      summary: [['Period', data.targetKpis?.period || data.reportMonth], ['Drivers', driverKpiRows.length], ['Total Target', `$${money(sumBy(driverKpiRows, 'target_amount'))}`], ['Total Sales', `$${money(sumBy(driverKpiRows, 'sales_total'))}`]],
      tables: [pdfTable(['Driver', 'Location', 'Target', 'Sales', 'Progress', 'Variance'], driverKpiRows.map((row) => [row.driver_name, row.location_name, `$${money(row.target_amount)}`, `$${money(row.sales_total)}`, percent(row.progress_percent), `$${money(row.variance_amount)}`]))]
    },
    {
      key: 'inventory',
      title: 'Inventory Summary',
      summary: [['Items', inventoryRows.length], ['Low Stock', inventoryRows.filter((item) => Number(item.available_stock ?? item.current_stock ?? 0) <= Number(item.minimum_stock || 0)).length], ['Total Available', money(inventoryRows.reduce((sum, item) => sum + Number(item.available_stock ?? item.current_stock ?? 0), 0))]],
      tables: [pdfTable(['Name', 'SKU', 'Stock', 'Reserved', 'Available', 'Min Stock', 'Status'], inventoryRows.map((item) => {
        const available = item.available_stock ?? item.current_stock;
        const low = Number(available || 0) <= Number(item.minimum_stock || 0);
        return [item.name, item.sku || '-', item.current_stock, item.reserved_stock || 0, available, item.minimum_stock, low ? 'Low stock' : 'OK'];
      }))]
    },
    {
      key: 'balances',
      title: 'Driver Balances',
      summary: [['Drivers', balanceRows.length], ['Outstanding', `$${money(balanceRows.reduce((sum, row) => sum + Number(row.balance || row.remaining_amount || 0), 0))}`]],
      tables: [pdfTable(['Driver', 'Phone', 'Status', 'Balance'], balanceRows.map((row) => [row.full_name, row.phone || '-', row.status || '-', `$${money(row.balance || row.remaining_amount)}`]))]
    },
    {
      key: 'missing',
      title: 'Missing Payments',
      summary: [['Period', data.missingPayments?.period || data.reportMonth], ['Requests', missingRows.length], ['Missing Total', `$${money(data.missingPayments?.total_missing || sumBy(missingRows, 'remaining_amount'))}`]],
      tables: [pdfTable(['Request', 'Driver', 'Completed', 'Payment Status', 'Total', 'Paid', 'Missing'], missingRows.map((row) => [row.request_number, row.driver_name, formatDate(row.completed_at), cleanText(row.payment_status), `$${money(row.total_amount)}`, `$${money(row.paid_amount)}`, `$${money(row.remaining_amount)}`]))]
    },
    {
      key: 'commissions',
      title: 'Driver Commissions',
      summary: [['Entries', commissionRows.length], ['Total Commission', `$${money(sumBy(commissionRows, 'total_commission'))}`], ['Enabled', data.commissionSummary?.enabled === false ? 'No' : 'Yes']],
      tables: [pdfTable(['Driver', 'Location', 'Sales', 'Target', 'Progress', 'Base', 'Bonus', 'Total'], commissionRows.map((row) => [row.driver_name, row.location_name, `$${money(row.sales_total)}`, `$${money(row.target_amount)}`, percent(row.target_progress_percent), `$${money(row.base_commission)}`, `$${money(row.bonus_commission)}`, `$${money(row.total_commission)}`]))]
    },
    {
      key: 'payments',
      title: 'Payment Summary',
      summary: [['Rows', paymentRows.length], ['Total', `$${money(paymentRows.reduce((sum, row) => sum + Number(row.total_amount || row.amount || row.total || 0), 0))}`], ['Date Filter', data.startDate || data.endDate ? `${data.startDate || 'Start'} to ${data.endDate || 'End'}` : 'None']],
      tables: [pdfTable(['Date', 'Total Amount'], paymentRows.map((row) => [row.date || row.payment_date || '-', `$${money(row.total_amount || row.amount || row.total)}`]))]
    },
    {
      key: 'purchases',
      title: 'Purchase Orders by Status',
      summary: [['Statuses', purchaseRows.length], ['Total Amount', `$${money(purchaseRows.reduce((sum, row) => sum + Number(row.total_amount || row.amount || 0), 0))}`]],
      tables: [pdfTable(['Status', 'Count', 'Amount'], purchaseRows.map((row) => [cleanText(row.status), row.count || 0, `$${money(row.total_amount || row.amount)}`]))]
    }
  ];
}

function buildDriverPdfTables(report, driverRows) {
  if (!report) {
    return [pdfTable(['Driver', 'Location', 'Requests', 'Net Sales', 'Paid', 'Missing', 'Target', 'Progress', 'Commission', 'Total Pay'], driverRows.map((row) => [row.driver?.full_name, row.driver?.current_location?.name || '-', row.summary?.request_count || 0, `$${money(row.summary?.net_sales)}`, `$${money(row.summary?.paid_in_period)}`, `$${money(row.summary?.missing_payments)}`, `$${money(row.kpi?.target_amount)}`, `${cleanText(row.kpi?.performance)} (${percent(row.kpi?.progress_percent)})`, `$${money(row.commission?.total_commission)}`, `$${money(row.payroll?.total_pay)}`]))];
  }
  return [
    pdfTable(['Metric', 'Value'], [['Driver', report.driver?.full_name], ['Location', report.driver?.current_location?.name || '-'], ['Net Sales', `$${money(report.summary?.net_sales)}`], ['Paid', `$${money(report.summary?.paid_in_period)}`], ['Missing', `$${money(report.summary?.missing_payments)}`], ['Target', `$${money(report.kpi?.target_amount)}`], ['Progress', percent(report.kpi?.progress_percent)], ['Commission', `$${money(report.commission?.total_commission)}`], ['Total Pay', `$${money(report.payroll?.total_pay)}`]]),
    pdfTable(['Request', 'Date', 'Type', 'Status', 'Total', 'Paid', 'Remaining'], (report.requests || []).map((row) => [row.request_number, row.request_date || '-', cleanText(row.request_type), cleanText(row.request_status), `$${money(row.total_amount)}`, `$${money(row.paid_amount)}`, `$${money(row.remaining_amount)}`])),
    pdfTable(['Payment', 'Request', 'Date', 'Method', 'Amount'], (report.payments || []).map((row) => [row.payment_number, row.request_number || '-', formatDate(row.payment_date), cleanText(row.payment_method), `$${money(row.amount)}`]))
  ];
}

function pdfTable(columns, rows) { return { columns, rows: rows || [] }; }

function openReportPdfWindow({ title, subtitle, sections }) {
  const printWindow = window.open('', '_blank', 'width=1040,height=900');
  if (!printWindow) return;
  printWindow.document.write(buildReportPdfHtml({ title, subtitle, sections }));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 350);
}

function buildReportPdfHtml({ title, subtitle, sections }) {
  return `<!doctype html><html><head><title>${escapeHtml(title)} - Stock Driver System</title><style>
    @page { size: A4 landscape; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.35; }
    header { border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; gap: 24px; }
    h1 { margin: 0 0 6px; font-size: 24px; letter-spacing: 0; }
    h2 { margin: 0; font-size: 16px; }
    .subtitle { color: #475569; font-size: 11px; }
    .brand { color: #475569; text-align: right; font-size: 11px; }
    section { page-break-inside: avoid; margin-bottom: 22px; }
    section + section { page-break-before: always; }
    .section-title { border-bottom: 1px solid #cbd5e1; padding-bottom: 7px; margin-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
    .summary-card { border: 1px solid #dbe3ee; background: #f8fafc; padding: 8px 10px; border-radius: 6px; min-height: 44px; }
    .summary-label { color: #64748b; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
    .summary-value { font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #eef2f7; color: #334155; text-align: left; text-transform: uppercase; font-size: 9px; padding: 7px 8px; border: 1px solid #d9e2ec; }
    td { padding: 7px 8px; border: 1px solid #e5e7eb; vertical-align: top; overflow-wrap: anywhere; }
    tbody tr:nth-child(even) td { background: #fbfdff; }
    .empty { color: #64748b; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 6px; }
    footer { position: fixed; bottom: 0; left: 0; right: 0; color: #94a3b8; font-size: 9px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style></head><body><header><div><h1>${escapeHtml(title)}</h1><div class="subtitle">${escapeHtml(subtitle)}</div></div><div class="brand"><strong>Stock Driver System</strong><br />Structured report export</div></header>${sections.map(reportSectionHtml).join('')}<footer><span>Stock Driver System</span><span>${escapeHtml(new Date().toLocaleString())}</span></footer></body></html>`;
}

function reportSectionHtml(section) {
  return `<section><div class="section-title"><h2>${escapeHtml(section.title)}</h2></div>${summaryHtml(section.summary)}${section.tables.map(tableHtml).join('')}</section>`;
}

function summaryHtml(summary = []) {
  if (!summary.length) return '';
  return `<div class="summary">${summary.map(([label, value]) => `<div class="summary-card"><div class="summary-label">${escapeHtml(label)}</div><div class="summary-value">${escapeHtml(value ?? '-')}</div></div>`).join('')}</div>`;
}

function tableHtml(table) {
  if (!table.rows.length) return '<div class="empty">No records available</div>';
  return `<table><thead><tr>${table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell ?? '-')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function sumBy(rows, key) { return (rows || []).reduce((sum, row) => sum + Number(row?.[key] || 0), 0); }

function sumNested(rows, path) {
  return (rows || []).reduce((sum, row) => {
    let value = row;
    path.forEach((key) => { value = value?.[key]; });
    return sum + Number(value || 0);
  }, 0);
}

function cleanText(value) { return String(value || '-').replace(/_/g, ' '); }
function formatDate(value) { return value ? new Date(value).toLocaleDateString() : '-'; }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function ReportSection({ title, icon: Icon, loading, children, summary, style = {} }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ overflow: 'hidden', ...style }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color="var(--accent-blue)" />
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{title}</h3>
        </div>
        {summary && <div>{summary}</div>}
      </div>
      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite', width: `${100 - i * 10}%` }} />)}
          </div>
        ) : children}
      </div>
    </motion.div>
  );
}

function SummaryChip({ label, value, color }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '700', color }}>{value}</span>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const color = tone === 'green' ? 'var(--accent-green)' : tone === 'orange' ? 'var(--accent-orange)' : 'var(--text-primary)';
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '14px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <div style={{ color, fontSize: '16px', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function SimpleTable({ columns, rows }) {
  if (!rows || !rows.length) return <EmptyState />;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr>{columns.map((c) => <Th key={c}>{c}</Th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
              {row.map((cell, j) => <Td key={j}>{cell}</Td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', fontWeight: '600' }}>{children}</th>;
}

function Td({ children, bold, color, secondary }) {
  return <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: bold ? 700 : 400, color: color || (secondary ? 'var(--text-secondary)' : 'var(--text-primary)') }}>{children}</td>;
}

function EmptyState() {
  return <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No records available</p>;
}

function money(v) { return Number(v || 0).toFixed(2); }
function percent(v) { return `${Number(v || 0).toFixed(0)}%`; }
