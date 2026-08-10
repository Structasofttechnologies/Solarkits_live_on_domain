import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
export default function SupportPage() {
  return <ModulePlaceholder title="Service & Support" icon="🎧" color="bg-teal-50 text-teal-600"
    kpis={[
      { label: 'Open Tickets', value: '48', icon: '🎫' },
      { label: 'In Progress', value: '31', icon: '⚙️' },
      { label: 'Resolved', value: '284', icon: '✅' },
      { label: 'SLA Violations', value: '7', icon: '⚠️' },
      { label: 'Support Agents', value: '14', icon: '👤' },
      { label: 'CSAT Score', value: '4.6/5', icon: '⭐' },
    ]} />;
}
