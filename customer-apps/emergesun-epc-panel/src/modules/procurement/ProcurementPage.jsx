import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
export default function ProcurementPage() {
  return <ModulePlaceholder title="Procurement" icon="🚛" color="bg-orange-50 text-orange-600"
    kpis={[
      { label: 'Purchase Requests', value: '64', icon: '📋' },
      { label: 'Purchase Orders', value: '41', icon: '📄' },
      { label: 'Suppliers', value: '28', icon: '🏪' },
      { label: 'Pending Approvals', value: '12', icon: '⏳' },
      { label: 'Deliveries Due', value: '8', icon: '📦' },
      { label: 'Procurement Value', value: '$1.2M', icon: '💰' },
    ]} />;
}
