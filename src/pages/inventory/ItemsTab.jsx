import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, PackagePlus, ArrowUpDown, Archive, RotateCcw, Trash2, AlertTriangle, List } from 'lucide-react';
import DataTable, { ActionButton, StatusBadge } from '../../components/DataTable.jsx';
import FilterBar from '../../components/FilterBar.jsx';
import Modal, { ConfirmModal } from '../../components/Modal.jsx';
import FormField, { FormInput, FormSelect, SubmitButton } from '../../components/FormField.jsx';
import PremiumCheckbox from '../../components/PremiumCheckbox.jsx';
import { toast } from '../../components/Toast.jsx';
import { authStore, inventoryStores } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';
import { ACTIVE_STATUSES, STOCK_ADJUSTMENT_TYPES, todayIsoDate } from '../../domain/index.js';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU', nowrap: true },
  { key: 'barcode', label: 'Barcode', nowrap: true, render: (row) => row.barcode || '-' },
  { key: 'category', label: 'Category', render: (row) => row.category?.name || '-' },
  { key: 'size', label: 'Size', render: (row) => row.is_carton ? `Carton of ${row.carton_quantity || 0} x ${row.carton_item?.name || 'item'}` : row.size_value ? `${row.size_value}${row.size_unit || ''}` : '-' },
  { key: 'current_stock', label: 'Stock', render: (row) => {
    const low = Number(row.available_stock ?? (row.current_stock || 0)) <= Number(row.minimum_stock || 0);
    return <div><span style={{ color: low ? 'var(--accent-red)' : 'var(--text-primary)', fontWeight: low ? '600' : '400' }}>{Number(row.current_stock || 0).toLocaleString()}</span><div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Avail {Number(row.available_stock ?? (row.current_stock || 0)).toLocaleString()} | Res {Number(row.reserved_stock || 0).toLocaleString()}</div></div>;
  }},
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  { key: 'purchase_price', label: 'Purchase Price', render: (row) => row.purchase_price != null ? `$${Number(row.purchase_price).toFixed(2)}` : '-' },
  { key: 'selling_price', label: 'Selling Price', render: (row) => row.selling_price != null ? `$${Number(row.selling_price).toFixed(2)}` : '-' }
];

const emptyForm = {
  name: '',
  sku: '',
  barcode: '',
  category_id: '',
  supplier_id: '',
  unit: 'piece',
  size_value: '',
  size_unit: 'g',
  is_carton: false,
  carton_item_id: '',
  carton_quantity: '',
  purchase_price: '',
  selling_price: '',
  minimum_stock: '0',
  track_batches: false,
  status: 'active'
};

export default function ItemsTab() {
  const { rows, meta, loading, error } = useStore(inventoryStores.items);
  const { user } = useStore(authStore);
  const catState = useStore(inventoryStores.categories);
  const supState = useStore(inventoryStores.suppliers);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm] = useState({});
  const [stockSaving, setStockSaving] = useState(false);
  const [lowStockMode, setLowStockMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    inventoryStores.items.load();
    inventoryStores.categories.load();
    inventoryStores.suppliers.load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      sku: row.sku || '',
      barcode: row.barcode || '',
      category_id: row.category_id || '',
      supplier_id: row.supplier_id || '',
      unit: row.unit || 'piece',
      size_value: row.size_value ?? '',
      size_unit: row.size_unit || 'g',
      is_carton: Boolean(row.is_carton),
      carton_item_id: row.carton_item_id || '',
      carton_quantity: row.carton_quantity ?? '',
      purchase_price: row.purchase_price ?? '',
      selling_price: row.selling_price ?? '',
      minimum_stock: row.minimum_stock ?? '0',
      track_batches: Boolean(row.track_batches),
      status: row.status || 'active'
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.is_carton && !form.carton_item_id) errs.carton_item_id = 'Contained item is required';
    if (form.is_carton && (!form.carton_quantity || Number(form.carton_quantity) <= 0)) errs.carton_quantity = 'Quantity is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      ...form,
      is_carton: Boolean(form.is_carton),
      unit: form.is_carton ? 'carton' : form.unit,
      size_value: form.is_carton || form.size_value === '' ? null : Number(form.size_value),
      size_unit: form.is_carton ? null : form.size_unit,
      carton_item_id: form.is_carton ? Number(form.carton_item_id) : null,
      carton_quantity: form.is_carton ? Number(form.carton_quantity) : null,
      purchase_price: Number(form.purchase_price) || 0,
      selling_price: Number(form.selling_price) || 0,
      minimum_stock: Number(form.minimum_stock) || 0,
      track_batches: Boolean(form.track_batches)
    };

    setSaving(true);
    try {
      if (editing) {
        await inventoryStores.items.update(editing.id, payload);
        toast.success('Item updated');
      } else {
        await inventoryStores.items.create(payload);
        toast.success('Item created');
      }
      setModalOpen(false);
      inventoryStores.items.load();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const openStockEntry = (row) => {
    setStockModal('entry');
    setStockForm({ item_id: row.id, item_name: row.name, supplier_id: row.supplier_id || '', quantity: '', unit_cost: '', batch_number: '', expiry_date: '', entry_date: todayIsoDate(), notes: '' });
  };

  const openStockAdjustment = (row) => {
    setStockModal('adjustment');
    setStockForm({ item_id: row.id, item_name: row.name, quantity: '', adjustment_type: 'adjustment_in', notes: '' });
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    const qty = Number(stockForm.quantity);
    if (!qty || qty <= 0) { toast.error('Quantity must be greater than 0'); return; }
    if (stockModal === 'entry' && !stockForm.entry_date) { toast.error('Entry date is required'); return; }

    setStockSaving(true);
    try {
      if (stockModal === 'entry') {
        await inventoryStores.stockEntries.submit({
          item_id: stockForm.item_id,
          supplier_id: stockForm.supplier_id || null,
          quantity: qty,
          unit_cost: Number(stockForm.unit_cost) || 0,
          batch_number: stockForm.batch_number || null,
          expiry_date: stockForm.expiry_date || null,
          entry_date: stockForm.entry_date,
          notes: stockForm.notes
        });
      } else {
        await inventoryStores.stockAdjustments.submit({ item_id: stockForm.item_id, quantity: qty, adjustment_type: stockForm.adjustment_type, notes: stockForm.notes });
      }
      toast.success(stockModal === 'entry' ? 'Stock entry recorded' : 'Stock adjustment recorded');
      setStockModal(null);
      inventoryStores.items.load();
    } catch (err) {
      toast.error(err?.message || 'Operation failed');
    } finally {
      setStockSaving(false);
    }
  };

  const categoryOptions = (catState.rows || []).filter((c) => c.status !== 'inactive').map((c) => ({ value: c.id, label: c.name }));
  const supplierOptions = (supState.rows || []).filter((s) => s.status !== 'inactive').map((s) => ({ value: s.id, label: s.name }));
  const cartonItemOptions = (rows || [])
    .filter((item) => item.status !== 'inactive' && !item.is_carton && (!editing || Number(item.id) !== Number(editing.id)))
    .map((item) => ({ value: item.id, label: `${item.name}${item.size_value ? ` (${item.size_value}${item.size_unit || ''})` : ''}` }));
  const can = (permission) => user?.role?.code === 'admin' || (user?.permissions || []).includes(permission);
  const canCreate = can('items.create');
  const canUpdate = can('items.update');
  const canArchive = can('items.archive');
  const canDelete = can('items.delete');
  const canStockEntry = can('items.stock_entry');
  const canAdjustStock = can('items.adjust_stock');
  const hasItemActions = canUpdate || canArchive || canDelete || canStockEntry || canAdjustStock;

  const reloadItems = () => {
    setLowStockMode(false);
    inventoryStores.items.load();
  };

  const loadLowStock = async () => {
    try {
      const result = await inventoryStores.items.loadLowStock();
      const data = Array.isArray(result.data) ? result.data : [];
      inventoryStores.items.setState({ rows: data, meta: { page: 1, pages: 1, total: data.length } });
      setLowStockMode(true);
    } catch (err) {
      toast.error(err?.message || 'Failed to load low-stock items');
    }
  };

  const toggleArchive = async (row) => {
    try {
      await inventoryStores.items.setStatus(row.id, row.status === 'inactive' ? 'active' : 'inactive');
      toast.success(row.status === 'inactive' ? 'Item restored' : 'Item archived');
      inventoryStores.items.load();
    } catch (err) {
      toast.error(err?.message || 'Failed to update item status');
    }
  };

  const confirmDelete = async () => {
    try {
      await inventoryStores.items.delete(deleteTarget.id);
      toast.success('Item permanently deleted');
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    }
    setDeleteTarget(null);
  };

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const categoryFilterOptions = useMemo(() => (catState.rows || []).map((c) => ({ value: String(c.id), label: c.name })), [catState.rows]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    if (categoryFilter) result = result.filter((r) => String(r.category_id) === categoryFilter);
    if (stockFilter === 'low') result = result.filter((r) => r.current_stock <= (r.minimum_stock || 0));
    return result;
  }, [rows, statusFilter, categoryFilter, stockFilter]);

  return (
    <>
      {/* Filters */}
      <FilterBar
        filters={[
          { key: 'status', label: 'Status', value: statusFilter, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
          { key: 'stock', label: 'Stock', value: stockFilter, options: [{ value: 'low', label: 'Low Stock' }] },
          ...(categoryFilterOptions.length > 0 ? [{ key: 'category', label: 'Category', value: categoryFilter, options: categoryFilterOptions }] : [])
        ]}
        onChange={(key, value) => { if (key === 'status') setStatusFilter(value); if (key === 'category') setCategoryFilter(value); if (key === 'stock') setStockFilter(value); }}
        onClear={() => { setStatusFilter(''); setCategoryFilter(''); setStockFilter(''); }}
      />

      <DataTable
        columns={columns}
        rows={filteredRows}
        meta={meta}
        loading={loading}
        error={error}
        onLoad={(filters) => { setLowStockMode(false); inventoryStores.items.load(filters); }}
        toolbar={
          <>
            <button onClick={lowStockMode ? reloadItems : loadLowStock} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--glass-border)', color: lowStockMode ? 'var(--accent-blue)' : 'var(--text-secondary)', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              {lowStockMode ? <List size={16} /> : <AlertTriangle size={16} />} {lowStockMode ? 'All Items' : 'Low Stock'}
            </button>
            {canCreate && <button className="glass-button" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={openCreate}>
              <Plus size={16} /> Add Item
            </button>}
          </>
        }
        actions={hasItemActions ? (row) => (
          <>
            {canUpdate && <ActionButton icon={Edit} label="Edit" onClick={() => openEdit(row)} />}
            {canStockEntry && <ActionButton icon={PackagePlus} label="Stock Entry" onClick={() => openStockEntry(row)} color="var(--accent-green)" />}
            {canAdjustStock && <ActionButton icon={ArrowUpDown} label="Adjustment" onClick={() => openStockAdjustment(row)} color="var(--accent-orange)" />}
            {canArchive && <ActionButton icon={row.status === 'inactive' ? RotateCcw : Archive} label={row.status === 'inactive' ? 'Restore' : 'Archive'} onClick={() => toggleArchive(row)} color="var(--accent-purple)" />}
            {canDelete && <ActionButton icon={Trash2} label="Delete Permanently" onClick={() => setDeleteTarget(row)} color="var(--accent-red)" />}
          </>
        ) : undefined}
      />

      <Modal open={modalOpen} title={editing ? 'Edit Item' : 'Add Item'} onClose={() => setModalOpen(false)} width="580px">
        <form onSubmit={handleSubmit}>
          <FormField label="Name" required error={errors.name}>
            <FormInput value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setErrors({ ...errors, name: null }); }} placeholder="Item name" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="SKU">
              <FormInput value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} placeholder="SKU" />
            </FormField>
            <FormField label="Barcode">
              <FormInput value={form.barcode} onChange={(v) => setForm({ ...form, barcode: v })} placeholder="Barcode" />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Type">
              <FormSelect
                value={form.is_carton ? 'carton' : 'regular'}
                onChange={(v) => setForm({ ...form, is_carton: v === 'carton' })}
                options={[{ value: 'regular', label: 'Regular item' }, { value: 'carton', label: 'Carton' }]}
              />
            </FormField>
          </div>

          {form.is_carton ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Contains Item" required error={errors.carton_item_id}>
                <FormSelect value={form.carton_item_id} onChange={(v) => setForm({ ...form, carton_item_id: v })} options={cartonItemOptions} placeholder="Select item" />
              </FormField>
              <FormField label="Quantity Inside Carton" required error={errors.carton_quantity}>
                <FormInput type="number" value={form.carton_quantity} onChange={(v) => setForm({ ...form, carton_quantity: v })} placeholder="10" min="0.001" step="0.001" />
              </FormField>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <FormField label="Unit">
                <FormInput value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="piece" />
              </FormField>
              <FormField label="Size">
                <FormInput type="number" value={form.size_value} onChange={(v) => setForm({ ...form, size_value: v })} placeholder="400" min="0" step="0.001" />
              </FormField>
              <FormField label="Size Unit">
                <FormSelect value={form.size_unit} onChange={(v) => setForm({ ...form, size_unit: v })} options={[
                  { value: 'g', label: 'g' },
                  { value: 'kg', label: 'kg' },
                  { value: 'ml', label: 'ml' },
                  { value: 'l', label: 'l' },
                  { value: 'piece', label: 'piece' }
                ]} />
              </FormField>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Category">
              <FormSelect value={form.category_id} onChange={(v) => setForm({ ...form, category_id: v })} options={categoryOptions} placeholder="Select category" />
            </FormField>
            <FormField label="Supplier">
              <FormSelect value={form.supplier_id} onChange={(v) => setForm({ ...form, supplier_id: v })} options={supplierOptions} placeholder="Select supplier" />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <FormField label="Purchase Price">
              <FormInput type="number" value={form.purchase_price} onChange={(v) => setForm({ ...form, purchase_price: v })} placeholder="0.00" min="0" step="0.01" />
            </FormField>
            <FormField label="Selling Price">
              <FormInput type="number" value={form.selling_price} onChange={(v) => setForm({ ...form, selling_price: v })} placeholder="0.00" min="0" step="0.01" />
            </FormField>
            <FormField label="Min Stock">
              <FormInput type="number" value={form.minimum_stock} onChange={(v) => setForm({ ...form, minimum_stock: v })} placeholder="0" min="0" />
            </FormField>
          </div>
          <div onClick={() => setForm({ ...form, track_batches: !form.track_batches })} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 16px', cursor: 'pointer', padding: '10px 12px', borderRadius: '10px', background: form.track_batches ? 'rgba(56, 189, 248, 0.06)' : 'transparent', border: form.track_batches ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent', transition: 'all 0.15s' }}>
            <PremiumCheckbox checked={form.track_batches} onChange={(v) => setForm({ ...form, track_batches: v })} />
            <span style={{ color: form.track_batches ? 'var(--accent-blue)' : 'var(--text-secondary)', fontWeight: form.track_batches ? 500 : 400, transition: 'color 0.15s' }}>Track batches and expiry</span>
          </div>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={ACTIVE_STATUSES.map((s) => ({ value: s, label: s }))} />
          </FormField>
          <SubmitButton loading={saving}>{editing ? 'Update' : 'Create'}</SubmitButton>
        </form>
      </Modal>

      <Modal open={!!stockModal} title={stockModal === 'entry' ? `Stock Entry - ${stockForm.item_name}` : `Stock Adjustment - ${stockForm.item_name}`} onClose={() => setStockModal(null)} width="420px">
        <form onSubmit={handleStockSubmit}>
          <FormField label="Quantity" required>
            <FormInput type="number" value={stockForm.quantity} onChange={(v) => setStockForm({ ...stockForm, quantity: v })} placeholder="0" min="0.01" step="0.01" />
          </FormField>
          {stockModal === 'entry' && (
            <>
              <FormField label="Supplier">
                <FormSelect value={stockForm.supplier_id} onChange={(v) => setStockForm({ ...stockForm, supplier_id: v })} options={supplierOptions} placeholder="Select supplier" />
              </FormField>
              <FormField label="Entry Date" required>
                <FormInput type="date" value={stockForm.entry_date} onChange={(v) => setStockForm({ ...stockForm, entry_date: v })} />
              </FormField>
              <FormField label="Unit Cost">
                <FormInput type="number" value={stockForm.unit_cost} onChange={(v) => setStockForm({ ...stockForm, unit_cost: v })} placeholder="0.00" min="0" step="0.01" />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Batch #">
                  <FormInput value={stockForm.batch_number} onChange={(v) => setStockForm({ ...stockForm, batch_number: v })} placeholder="Optional" />
                </FormField>
                <FormField label="Expiry">
                  <FormInput type="date" value={stockForm.expiry_date} onChange={(v) => setStockForm({ ...stockForm, expiry_date: v })} />
                </FormField>
              </div>
            </>
          )}
          {stockModal === 'adjustment' && (
            <FormField label="Type" required>
              <FormSelect value={stockForm.adjustment_type} onChange={(v) => setStockForm({ ...stockForm, adjustment_type: v })} options={STOCK_ADJUSTMENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
            </FormField>
          )}
          <FormField label="Notes">
            <FormInput value={stockForm.notes} onChange={(v) => setStockForm({ ...stockForm, notes: v })} placeholder="Optional notes" />
          </FormField>
          <SubmitButton loading={stockSaving}>Submit</SubmitButton>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title="Permanently Delete Item"
        message={`Delete ${deleteTarget?.name}? This only works when the item has no stock, purchase, request, or movement history.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
