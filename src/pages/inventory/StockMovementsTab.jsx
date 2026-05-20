import React, { useEffect } from 'react';
import DataTable, { StatusBadge } from '../../components/DataTable.jsx';
import { inventoryStores } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';

const columns = [
  { key: 'created_at', label: 'Date', nowrap: true, render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : '-' },
  { key: 'item', label: 'Item', render: (row) => row.item?.name || '-' },
  { key: 'movement_type', label: 'Type', render: (row) => row.movement_type === 'purchase_received' ? <StatusBadge status="stock_in" colorMap={{ stock_in: 'var(--accent-green)' }} /> : <StatusBadge status={row.movement_type} /> },
  { key: 'entered_quantity', label: 'Entered Qty', render: (row) => row.entered_quantity ? `${Number(row.entered_quantity).toLocaleString()} ${row.entered_unit_label || ''}` : Number(row.quantity || 0).toLocaleString() },
  { key: 'quantity', label: 'Base Qty', render: (row) => Number(row.base_quantity || row.quantity || 0).toLocaleString() },
  { key: 'stock_before', label: 'Before', render: (row) => Number(row.stock_before || 0).toLocaleString() },
  { key: 'stock_after', label: 'After', render: (row) => Number(row.stock_after || 0).toLocaleString() },
  { key: 'reference_type', label: 'Reference', render: (row) => row.reference_type ? `${row.reference_type} #${row.reference_id || '-'}` : '-' },
  { key: 'notes', label: 'Notes' }
];

export default function StockMovementsTab() {
  const { rows, meta, loading, error } = useStore(inventoryStores.stockMovements);

  useEffect(() => { inventoryStores.stockMovements.load(); }, []);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      meta={meta}
      loading={loading}
      error={error}
      onLoad={(filters) => inventoryStores.stockMovements.load(filters)}
      emptyMessage="No stock movements recorded"
    />
  );
}
