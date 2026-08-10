import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
export default function CommercialSolarPage() {
  return <ModulePlaceholder title="Commercial Solar" icon="🏭" color="bg-blue-50 text-blue-600"
    kpis={[
      { label: 'Commercial Leads', value: '142', icon: '📋' },
      { label: 'Site Assessments', value: '98', icon: '🔍' },
      { label: 'Proposals Sent', value: '71', icon: '📄' },
      { label: 'Active Contracts', value: '45', icon: '📝' },
      { label: 'Project Capacity (MW)', value: '12.4', icon: '⚡' },
      { label: 'Installations', value: '33', icon: '☀️' },
    ]} />;
}
