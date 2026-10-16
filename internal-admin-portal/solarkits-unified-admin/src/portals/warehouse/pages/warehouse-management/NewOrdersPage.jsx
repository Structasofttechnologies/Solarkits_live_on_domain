import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBoxes } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader';
import NewOrdersDeliveryManager from './NewOrdersDeliveryManager';

export default function NewOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateToOutward = (ord) => {
    const prefix = location.pathname.startsWith('/warehouse-management-panel')
      ? '/warehouse-management-panel'
      : '/warehouse';
    navigate(`${prefix}/out-for-delivery`);
  };

  return (
    <div className="space-y-6">
      {/* Module A Header */}
      <PageHeader
        title="New Orders (Procurement Fulfillment)"
        subtitle="Review sales orders confirmed by Account Manager, check warehouse BOS Kit inventory, allocate stock, order shortages via Account Panel, and inward materials."
        icon={FaBoxes}
      />

      {/* Main Delivery Manager Module */}
      <NewOrdersDeliveryManager onNavigateToOutward={handleNavigateToOutward} />
    </div>
  );
}
