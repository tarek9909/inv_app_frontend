import React, { useState } from 'react';
import TabBar from '../../components/TabBar.jsx';
import CategoriesTab from './CategoriesTab.jsx';
import SuppliersTab from './SuppliersTab.jsx';
import ItemsTab from './ItemsTab.jsx';
import PurchaseOrdersTab from './PurchaseOrdersTab.jsx';
import StockMovementsTab from './StockMovementsTab.jsx';
import { authStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';

const TABS = [
  { key: 'items', label: 'Items', permission: 'items.view' },
  { key: 'categories', label: 'Categories', permission: 'categories.view' },
  { key: 'suppliers', label: 'Suppliers', permission: 'suppliers.view' },
  { key: 'purchase-orders', label: 'Purchase Orders', permission: 'purchase_orders.view' },
  { key: 'stock-movements', label: 'Stock Movements', permission: 'stock_movements.view' }
];

export default function InventoryPage() {
  const { user } = useStore(authStore);
  const can = (permission) => user?.role?.code === 'admin' || (user?.permissions || []).includes(permission);
  const tabs = TABS.filter((tab) => can(tab.permission));
  const [activeTab, setActiveTab] = useState('items');
  const resolvedActive = tabs.some((tab) => tab.key === activeTab) ? activeTab : tabs[0]?.key;

  return (
    <div>
      <TabBar tabs={tabs} active={resolvedActive} onChange={setActiveTab} />
      {resolvedActive === 'items' && <ItemsTab />}
      {resolvedActive === 'categories' && <CategoriesTab />}
      {resolvedActive === 'suppliers' && <SuppliersTab />}
      {resolvedActive === 'purchase-orders' && <PurchaseOrdersTab />}
      {resolvedActive === 'stock-movements' && <StockMovementsTab />}
    </div>
  );
}
