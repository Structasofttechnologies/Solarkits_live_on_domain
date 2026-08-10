import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
export default function ResidentialSolarPage() {
  return <ModulePlaceholder title="Residential Solar" icon="🏠" color="bg-amber-50 text-amber-600"
    kpis={[
      { label: 'Total Leads', value: '284', icon: '📋' },
      { label: 'Surveys Done', value: '196', icon: '🔍' },
      { label: 'Quotes Sent', value: '143', icon: '📄' },
      { label: 'Active Projects', value: '87', icon: '⚙️' },
      { label: 'Installations', value: '62', icon: '☀️' },
      { label: 'Customer Requests', value: '23', icon: '📩' },
    ]} />;
}
