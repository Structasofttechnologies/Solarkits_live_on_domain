import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
export default function SolarShopPage() {
  return <ModulePlaceholder title="Solar E-Shop" icon="🛒" color="bg-purple-50 text-purple-600"
    kpis={[
      { label: 'Products Listed', value: '312', icon: '📦' },
      { label: 'Categories', value: '18', icon: '🗂️' },
      { label: 'Total Orders', value: '1,240', icon: '🧾' },
      { label: 'Inventory Value', value: '$2.4M', icon: '💰' },
      { label: 'Active Customers', value: '486', icon: '👥' },
      { label: 'Monthly Revenue', value: '$89K', icon: '📈' },
    ]} />;
}
