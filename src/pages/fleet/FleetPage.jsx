import React, { useState } from 'react';
import TabBar from '../../components/TabBar.jsx';
import DriversTab from './DriversTab.jsx';
import LocationsTab from './LocationsTab.jsx';
import CommissionRulesTab from './CommissionRulesTab.jsx';
import MonthlyTargetsTab from './MonthlyTargetsTab.jsx';
import StockRequestsTab from './StockRequestsTab.jsx';
import PaymentsTab from './PaymentsTab.jsx';
import { authStore } from '../../state/index.js';
import { useStore } from '../../hooks/useStore.js';

const TABS = [
  { key: 'stock-requests', label: 'Stock Requests', permission: 'stock_requests.view' },
  { key: 'drivers', label: 'Drivers', permission: 'drivers.view' },
  { key: 'locations', label: 'Locations', permission: 'locations.view' },
  { key: 'commissions', label: 'Commissions', permission: 'commissions.manage' },
  { key: 'targets', label: 'Targets', permission: 'targets.manage' },
  { key: 'payments', label: 'Payments', permission: 'payments.view' }
];

export default function FleetPage() {
  const { user } = useStore(authStore);
  const can = (permission) => user?.role?.code === 'admin' || (user?.permissions || []).includes(permission);
  const tabs = TABS.filter((tab) => can(tab.permission));
  const [activeTab, setActiveTab] = useState('stock-requests');
  const resolvedActive = tabs.some((tab) => tab.key === activeTab) ? activeTab : tabs[0]?.key;

  return (
    <div>
      <TabBar tabs={tabs} active={resolvedActive} onChange={setActiveTab} />
      {resolvedActive === 'stock-requests' && <StockRequestsTab />}
      {resolvedActive === 'drivers' && <DriversTab />}
      {resolvedActive === 'locations' && <LocationsTab />}
      {resolvedActive === 'commissions' && <CommissionRulesTab />}
      {resolvedActive === 'targets' && <MonthlyTargetsTab />}
      {resolvedActive === 'payments' && <PaymentsTab />}
    </div>
  );
}
