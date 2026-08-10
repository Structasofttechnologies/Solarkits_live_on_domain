import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
export default function CrmPage() {
  return <ModulePlaceholder title="CRM" icon="🤝" color="bg-green-50 text-green-600"
    kpis={[
      { label: 'Total Leads', value: '520', icon: '📋' },
      { label: 'Opportunities', value: '184', icon: '💡' },
      { label: 'Follow-ups Due', value: '37', icon: '📅' },
      { label: 'Conversion Rate', value: '24%', icon: '📊' },
      { label: 'Pipeline Value', value: '$3.1M', icon: '💰' },
      { label: 'Lead Sources', value: '8', icon: '🎯' },
    ]} />;
}
