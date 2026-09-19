/**
 * DetailDrawer.jsx
 *
 * Slide-over detail drawer for Franchisee, Warehouse, and Kit details.
 * Uses the existing Drawer component pattern from the project.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHome, FiUsers, FiPackage, FiMapPin, FiPhone, FiMail, FiCalendar, FiTrendingUp, FiTarget } from 'react-icons/fi';
import { visionApi } from './visionDashboardApi';
import { ProgressBar, LineChart } from './VisionCharts';

// ── Section heading ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-widest border-b border-border pb-1">{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2 text-sm">
      <span className="text-text-muted shrink-0">{label}</span>
      <span className="text-text-primary font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

// ── Franchisee Detail ─────────────────────────────────────────────────────────
function FranchiseeDetail({ item }) {
  const [perfData, setPerfData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = item.franchisee_id?._id || item.franchisee_id?.id || item._id;
    if (!id) { setLoading(false); return; }
    visionApi.getFranchiseePerformance(id)
      .then(r => { if (r?.status === 'success') setPerfData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item]);

  const f       = item.franchisee_id || item;
  const current = perfData?.current_month;
  const history = perfData?.history || [];

  const chartData = [...history]
    .sort((a, b) => a.target_year !== b.target_year ? a.target_year - b.target_year : a.target_month - b.target_month)
    .map(h => ({ label: `${h.target_month}/${h.target_year}`.slice(0, 4), value: h.eligible_quantity || 0 }));

  const pct = current?.achievement_pct || 0;

  return (
    <div className="space-y-5">
      <Section title="Business Info">
        <Row label="Name"    value={f.business_name} />
        <Row label="Mobile"  value={<span className="flex items-center gap-1"><FiPhone size={11} />{f.mobile}</span>} />
        <Row label="Email"   value={<span className="flex items-center gap-1"><FiMail size={11} />{f.email}</span>} />
        <Row label="State"   value={f.address?.state_name   || f.address?.state_id} />
        <Row label="District"value={f.address?.district_name || f.address?.district_id} />
        <Row label="Status"  value={f.activation_status} />
        <Row label="KYC"     value={f.kyc_status} />
        <Row label="Shop Operational" value={f.is_operational ? '✓ Yes' : '✗ No'} />
      </Section>

      <Section title="Current Month Performance">
        {loading ? <div className="h-8 bg-border rounded animate-pulse" /> : (
          current ? (
            <div className="space-y-2">
              <Row label="Target"    value={current.target_quantity ?? '—'} />
              <Row label="Delivered" value={current.eligible_quantity ?? '—'} />
              <Row label="Remaining" value={current.balance_quantity ?? '—'} />
              <div className="space-y-1">
                <Row label="Achievement" value={`${Math.round(pct)}%`} />
                <ProgressBar value={Math.min(pct, 100)}
                  colorClass={pct >= 100 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-danger'}
                  height={6} showLabel />
              </div>
              <Row label="Status" value={current.performance_status} />
            </div>
          ) : <p className="text-xs text-text-muted">No data for current month.</p>
        )}
      </Section>

      {chartData.length >= 2 && (
        <Section title="6-Month Kits Sold Trend">
          <LineChart data={chartData} height={120} width={340} color="var(--color-primary)" />
        </Section>
      )}

      <Section title="Recent POs">
        {loading ? <div className="h-8 bg-border rounded animate-pulse" /> :
          (perfData?.recent_pos?.length ? (
            <div className="space-y-1">
              {perfData.recent_pos.map((po, i) => (
                <div key={i} className="flex justify-between text-xs py-1.5 border-b border-border last:border-0">
                  <span className="text-text-secondary">{po.po_number || `PO-${i+1}`}</span>
                  <span className={`font-medium ${po.status === 'COMPLETED' ? 'text-success' : po.status === 'CANCELLED' ? 'text-danger' : 'text-warning'}`}>
                    {po.status}
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-text-muted">No recent orders.</p>)
        }
      </Section>
    </div>
  );
}

// ── Warehouse Detail ──────────────────────────────────────────────────────────
function WarehouseDetail({ item }) {
  return (
    <div className="space-y-5">
      <Section title="Warehouse Info">
        <Row label="Name"       value={item.name || item.warehouse_name} />
        <Row label="Active"     value={item.is_active ? '✓ Active' : '✗ Inactive'} />
        <Row label="District"   value={item.district_name || item.district_id} />
        <Row label="State"      value={item.state_name || item.state_id} />
        <Row label="Address"    value={item.address} />
      </Section>
      <Section title="Capacity">
        <Row label="Max Kits"        value={item.max_kits ?? '—'} />
        <Row label="Current Stock"   value={item.current_stock_kits ?? '—'} />
        <Row label="Allocated In"    value={item.allocated_incoming_kits ?? '—'} />
      </Section>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────
export default function DetailDrawer({ open, onClose, type, item }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const title = type === 'franchisee' ? 'Franchisee Details'
    : type === 'warehouse' ? 'Warehouse Details'
    : type === 'kit' ? 'Kit Details'
    : 'Details';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">{title}</h3>
              <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-text-secondary hover:text-text-primary"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hover px-5 py-4">
              {!item ? (
                <p className="text-text-muted text-sm text-center mt-10">No item selected.</p>
              ) : type === 'franchisee' ? (
                <FranchiseeDetail item={item} />
              ) : type === 'warehouse' ? (
                <WarehouseDetail item={item} />
              ) : (
                <pre className="text-xs text-text-secondary bg-surface-hover p-3 rounded-lg overflow-auto">
                  {JSON.stringify(item, null, 2)}
                </pre>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
