import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Eye, Printer } from 'lucide-react';
import DataTable, { ActionButton, StatusBadge } from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import PremiumCheckbox from '../components/PremiumCheckbox.jsx';
import { authStore, driverStore } from '../state/index.js';
import { useStore } from '../hooks/useStore.js';
import { toast } from '../components/Toast.jsx';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const receiptLabel = (request) => {
  if (!request?.driver_received_at) return 'Receipt pending';
  if (request.driver_receipt_status === 'receipt_partial') return 'Partial receipt';
  if (request.driver_receipt_status === 'receipt_not_confirmed') return 'Not confirmed';
  return 'Receipt submitted';
};

const receiptTone = (request) => {
  if (!request?.driver_received_at) return 'pending';
  if (request.driver_receipt_status === 'receipt_partial') return 'partially_paid';
  if (request.driver_receipt_status === 'receipt_not_confirmed') return 'cancelled';
  return 'completed';
};

const columns = [
  { key: 'request_number', label: 'Order #' },
  { key: 'request_date', label: 'Date' },
  { key: 'request_status', label: 'Status', render: (row) => <StatusBadge status={row.request_status} /> },
  { key: 'driver_receipt_status', label: 'Receipt', render: (row) => <ReceiptBadge request={row} /> },
  { key: 'payment_status', label: 'Payment', render: (row) => <StatusBadge status={row.payment_status} /> },
  { key: 'total_amount', label: 'Total', render: (row) => money(row.total_amount) },
  { key: 'remaining_amount', label: 'Remaining', render: (row) => money(row.remaining_amount) }
];

const adminColumns = [
  { key: 'driver', label: 'Driver', render: (row) => row.driver?.full_name || '-' },
  ...columns
];

const activeStatuses = ['draft', 'pending', 'approved'];
const historyStatuses = ['completed', 'cancelled'];

export default function DriverPortalPage() {
  const { user } = useStore(authStore);
  const { driver, rows, loading, error } = useStore(driverStore);
  const [detail, setDetail] = useState(null);
  const [view, setView] = useState('active');
  const isAdmin = user?.role?.code === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      driverStore.loadMe().catch((err) => toast.error(err?.message || 'Failed to load driver profile'));
    }
    driverStore.loadRequests().catch(() => {});
  }, [isAdmin]);

  const openDetail = async (row) => {
    try {
      const result = await driverStore.loadRequest(row.id);
      setDetail(result.data || row);
    } catch (err) {
      toast.error(err?.message || 'Failed to load order');
    }
  };

  const { activeRows, historyRows } = useMemo(() => ({
    activeRows: rows.filter((row) => activeStatuses.includes(row.request_status)),
    historyRows: rows.filter((row) => historyStatuses.includes(row.request_status))
  }), [rows]);
  const visibleRows = view === 'history' ? historyRows : activeRows;

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{isAdmin ? 'All Driver Orders' : driver?.full_name || 'Driver Orders'}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {isAdmin ? 'Current and historical stock requests across drivers.' : 'Active orders and completed history assigned to your account.'}
        </p>
      </div>
      <PortalViewSwitch
        value={view}
        onChange={setView}
        activeCount={activeRows.length}
        historyCount={historyRows.length}
      />
      <DataTable
        columns={isAdmin ? adminColumns : columns}
        rows={visibleRows}
        meta={{ total: visibleRows.length, page: 1, pages: 1 }}
        loading={loading}
        error={error}
        onLoad={() => driverStore.loadRequests()}
        emptyMessage={view === 'history' ? 'No order history yet' : 'No active orders now'}
        actions={(row) => <ActionButton icon={Eye} label="View" onClick={() => openDetail(row)} />}
      />
      <Modal open={!!detail} title={`Order ${detail?.request_number || ''}`} onClose={() => setDetail(null)} width="720px">
        {detail && <DriverRequestDetail request={detail} readOnly={isAdmin} onRequestUpdated={(request) => {
          setDetail(request);
          driverStore.loadRequests().catch(() => {});
        }} />}
      </Modal>
    </>
  );
}

function PortalViewSwitch({ value, onChange, activeCount, historyCount }) {
  const options = [
    { key: 'active', label: 'Active Now', count: activeCount },
    { key: 'history', label: 'History', count: historyCount }
  ];
  return (
    <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', border: '1px solid var(--glass-border)', borderRadius: '10px', background: 'var(--surface-subtle)', marginBottom: '16px' }}>
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            style={{
              border: selected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
              background: selected ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
              color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: selected ? 600 : 500
            }}
          >
            <span>{option.label}</span>
            <span style={{ color: selected ? 'var(--accent-blue)' : 'var(--text-muted)' }}>{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function DriverRequestDetail({ request, onRequestUpdated, readOnly = false }) {
  const [checks, setChecks] = useState(() => Object.fromEntries((request.items || []).map((line) => [line.id, Boolean(line.confirmation?.confirmed)])));
  const [quantities, setQuantities] = useState(() => Object.fromEntries((request.items || []).map((line) => [
    line.id,
    line.confirmation?.confirmed_quantity ?? (line.confirmation?.confirmed ? line.quantity : '')
  ])));
  const [notes, setNotes] = useState(request.driver_receipt_notes || '');
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const receiptSubmitted = Boolean(request.driver_received_at);

  useEffect(() => {
    setChecks(Object.fromEntries((request.items || []).map((line) => [line.id, Boolean(line.confirmation?.confirmed)])));
    setQuantities(Object.fromEntries((request.items || []).map((line) => [
      line.id,
      line.confirmation?.confirmed_quantity ?? (line.confirmation?.confirmed ? line.quantity : '')
    ])));
    setNotes(request.driver_receipt_notes || '');
  }, [request]);

  const setLineChecked = (line, checked) => {
    setChecks({ ...checks, [line.id]: checked });
    setQuantities({
      ...quantities,
      [line.id]: checked ? (quantities[line.id] || line.quantity) : ''
    });
  };

  const printInvoice = async () => {
    const printWindow = window.open('', '_blank', 'width=840,height=900');
    if (!printWindow) {
      toast.error('Allow popups to print the invoice');
      return;
    }
    printWindow.document.write('<!doctype html><title>Opening invoice...</title><body>Opening invoice...</body>');
    printWindow.document.close();
    if (readOnly) {
      printInvoiceWindow(printWindow, request);
      return;
    }
    setSavingInvoice(true);
    try {
      const result = await driverStore.markInvoiceViewed(request.id);
      const nextRequest = result.data || request;
      onRequestUpdated(nextRequest);
      printInvoiceWindow(printWindow, nextRequest);
      toast.success('Invoice opened');
    } catch (err) {
      printWindow.close();
      toast.error(err?.message || 'Failed to open invoice');
    } finally {
      setSavingInvoice(false);
    }
  };

  const submitReceipt = async () => {
    setSavingReceipt(true);
    try {
      const payload = {
        notes,
        items: (request.items || []).map((line) => ({
          stock_request_item_id: line.id,
          confirmed: Boolean(checks[line.id]),
          confirmed_quantity: Boolean(checks[line.id]) ? Number(quantities[line.id] || 0) : 0
        }))
      };
      const result = await driverStore.submitReceipt(request.id, payload);
      onRequestUpdated(result.data || request);
      toast.success('Receipt confirmation submitted');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit receipt');
    } finally {
      setSavingReceipt(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {request.driver && <Info label="Driver" value={request.driver.full_name || `Driver #${request.driver_id}`} />}
        <Info label="Status" value={<StatusBadge status={request.request_status} />} />
        <Info label="Receipt" value={<ReceiptBadge request={request} />} />
        <Info label="Payment" value={<StatusBadge status={request.payment_status} />} />
        <Info label="Total" value={money(request.total_amount)} />
        <Info label="Paid" value={money(request.paid_amount)} />
        <Info label="Remaining" value={money(request.remaining_amount)} />
      </div>

      <div className="driver-detail-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" className="glass-button" onClick={printInvoice} disabled={savingInvoice || request.request_status !== 'approved'}>
          <Printer size={16} /> {readOnly ? 'Print Invoice' : savingInvoice ? 'Opening...' : request.driver_invoice_viewed_at ? 'Print Invoice Again' : 'Open Printable Invoice'}
        </button>
        {!readOnly && request.driver_invoice_viewed_at && <span style={{ color: 'var(--text-secondary)', fontSize: '13px', alignSelf: 'center' }}>Invoice opened</span>}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Received', 'Received Qty', 'Item', 'Qty', 'Unit Price', 'Total'].map((head) => (
                <th key={head} style={{ padding: '10px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', borderBottom: '1px solid var(--glass-border)' }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(request.items || []).map((line) => (
              <tr key={line.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                  <PremiumCheckbox
                    checked={Boolean(checks[line.id])}
                    disabled={readOnly || receiptSubmitted}
                    onChange={(v) => setLineChecked(line, v)}
                  />
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)', minWidth: '110px' }}>
                  <input
                    type="number"
                    min="0"
                    max={line.quantity}
                    step="0.01"
                    value={quantities[line.id] ?? ''}
                    disabled={readOnly || receiptSubmitted || !checks[line.id]}
                    onChange={(event) => setQuantities({ ...quantities, [line.id]: event.target.value })}
                    className="glass-input"
                    style={{ width: '96px', fontSize: '13px', padding: '8px 10px' }}
                  />
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.item?.name || `Item #${line.item_id}`}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{line.quantity}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{money(line.unit_price)}</td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>{money(Number(line.quantity || 0) * Number(line.unit_price || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>Receipt Notes</label>
        <textarea
          value={notes}
          disabled={readOnly || receiptSubmitted}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Optional notes about missing or mismatched items"
          style={{ width: '100%', resize: 'vertical', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--surface-subtle)', color: 'var(--text-primary)', padding: '10px 12px' }}
        />
      </div>
      {!readOnly && (
        <button
          type="button"
          className="glass-button"
          onClick={submitReceipt}
          disabled={savingReceipt || receiptSubmitted || !request.driver_invoice_viewed_at || request.request_status !== 'approved'}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <CheckSquare size={16} /> {receiptSubmitted ? 'Receipt Submitted' : savingReceipt ? 'Submitting...' : 'Submit Receipt Confirmation'}
        </button>
      )}
      {request.notes && <Info label="Notes" value={request.notes} />}
    </div>
  );
}

function printInvoiceWindow(printWindow, request) {
  printWindow.document.write(buildInvoiceHtml(request));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function buildInvoiceHtml(request) {
  const rows = (request.items || []).map((line) => `
    <tr>
      <td>${escapeHtml(line.item?.name || `Item #${line.item_id}`)}</td>
      <td>${escapeHtml(line.quantity)}</td>
      <td>${money(line.unit_price)}</td>
      <td>${money(Number(line.quantity || 0) * Number(line.unit_price || 0))}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <title>Invoice ${escapeHtml(request.request_number || '')}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          h1 { font-size: 24px; margin: 0 0 8px; }
          .muted { color: #6b7280; font-size: 13px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin: 24px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
          th { color: #6b7280; text-transform: uppercase; font-size: 11px; }
          .totals { margin-top: 18px; margin-left: auto; width: 260px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .signature { margin-top: 48px; }
        </style>
      </head>
      <body>
        <h1>Stock Request Invoice</h1>
        <div class="muted">Request ${escapeHtml(request.request_number || '')}</div>
        <div class="grid">
          <div><strong>Driver:</strong> ${escapeHtml(request.driver?.full_name || '-')}</div>
          <div><strong>Date:</strong> ${escapeHtml(request.request_date || '-')}</div>
          <div><strong>Status:</strong> ${escapeHtml(request.request_status || '-')}</div>
          <div><strong>Payment:</strong> ${escapeHtml(request.payment_status || '-')}</div>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><strong>${money(request.subtotal)}</strong></div>
          <div class="total-row"><span>Discount</span><strong>${money(request.discount_amount)}</strong></div>
          <div class="total-row"><span>Total</span><strong>${money(request.total_amount)}</strong></div>
          <div class="total-row"><span>Remaining</span><strong>${money(request.remaining_amount)}</strong></div>
        </div>
        <div class="signature">Warehouse manager signature: ____________________________</div>
      </body>
    </html>
  `;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function Info({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '14px' }}>{value}</div>
    </div>
  );
}

function ReceiptBadge({ request }) {
  const colorByTone = {
    pending: 'var(--accent-orange)',
    partially_paid: 'var(--accent-blue)',
    cancelled: 'var(--accent-red)',
    completed: 'var(--accent-green)'
  };
  const color = colorByTone[receiptTone(request)] || 'var(--text-secondary)';
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: `color-mix(in srgb, ${color} 15%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
      {receiptLabel(request)}
    </span>
  );
}
