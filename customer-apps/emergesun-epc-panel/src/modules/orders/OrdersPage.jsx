import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
export default function OrdersPage() {
  return <ModulePlaceholder title="Order Management" icon="📋" color="bg-indigo-50 text-indigo-600"
    kpis={[
      { label: 'Total Orders', value: '1,842', icon: '🧾' },
      { label: 'Pending', value: '94', icon: '⏳' },
      { label: 'Confirmed', value: '312', icon: '✅' },
      { label: 'Processing', value: '185', icon: '⚙️' },
      { label: 'Delivered', value: '1,198', icon: '✔️' },
      { label: 'Cancelled', value: '53', icon: '❌' },
    ]} />;
}
