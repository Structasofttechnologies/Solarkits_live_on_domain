import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import {
  FiDollarSign, FiClock, FiArrowUpRight, FiArrowDownLeft,
  FiCheckCircle, FiLoader, FiXCircle, FiAlertCircle,
  FiTrendingUp, FiMinusCircle, FiInfo, FiRefreshCw,
  FiShield, FiFileText, FiPercent,
} from "react-icons/fi";

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:    { label: "Pending Settlement", bg: "#fef3c7", text: "#92400e", icon: FiClock },
  processing: { label: "Processing",         bg: "#dbeafe", text: "#1e40af", icon: FiLoader },
  paid:       { label: "Paid to Bank",       bg: "#d1fae5", text: "#065f46", icon: FiCheckCircle },
  rejected:   { label: "Rejected",          bg: "#fee2e2", text: "#991b1b", icon: FiXCircle },
  failed:     { label: "Failed",            bg: "#fce7f3", text: "#9d174d", icon: FiAlertCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, badge }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon size={22} />
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="mt-3 min-w-0">
        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate">{label}</div>
        <div className="text-xl font-black text-slate-900 mt-0.5 truncate">{value}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Rupee Formatter ─────────────────────────────────────────────────────────
function fmt(val) {
  return `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Main Component: My Earnings ──────────────────────────────────────────────
export default function WalletPortal() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ledger"); // "ledger" | "payouts"
  const [filterType, setFilterType] = useState("all");

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/india/v1/reseller/wallet/me"),
      api.get("/india/v1/reseller/wallet/ledger"),
      api.get("/india/v1/reseller/wallet/payouts"),
    ])
      .then(([wRes, lRes, pRes]) => {
        if (wRes.data?.status === "success") setWallet(wRes.data.data);
        if (lRes.data?.status === "success") setLedger(lRes.data.data);
        if (pRes.data?.status === "success") setPayouts(pRes.data.data);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const fd = wallet?.formula_breakdown || {};
  const grossEarned = fd.gross_earnings || wallet?.gross_earned || 0;
  const tdsDeducted = Math.abs(fd.minus_tds || -(wallet?.tds_deducted || 0));
  const tcsDeducted = Math.abs(fd.minus_tcs || -(wallet?.tcs_deducted || 0));
  const netEarned = fd.net_earnings || wallet?.total_earned || 0;
  const totalPaid = Math.abs(fd.minus_completed_withdrawals || -(wallet?.total_withdrawn || 0));
  const pendingHolds = Math.abs(fd.minus_pending_holds || -(wallet?.pending_balance || 0));
  const availBalance = fd.equals_available_balance || wallet?.available_balance || 0;

  const isTdsCut = tdsDeducted > 0;

  // Filtered Ledger rows
  const filteredLedger = filterType === "all"
    ? ledger
    : ledger.filter((l) => l.transaction_type === filterType);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FiTrendingUp className="text-blue-600" size={28} />
            My Earnings
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Real-time franchisee earnings summary, commission statements, TDS deductions, and payout history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors shadow-xs"
            title="Refresh"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin text-blue-600" : "text-slate-500"} />
            <span>Refresh Statement</span>
          </button>
        </div>
      </div>

      {/* ── Frozen Wallet Warning ─────────────────────────────────────────── */}
      {wallet?.status === "frozen" && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-sm font-semibold">
          <FiAlertCircle className="shrink-0" size={20} />
          Your earnings account is currently under administrative freeze. Please contact regional partner support.
        </div>
      )}

      {/* ── KPI Cards (Gross, TDS, Net, Paid, Pending, Available) ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          icon={FiTrendingUp}
          iconBg="#d1fae5"
          iconColor="#059669"
          label="Total Gross Earnings"
          value={fmt(grossEarned)}
          sub="Pre-tax commissions & margins"
        />

        <KpiCard
          icon={FiPercent}
          iconBg={isTdsCut ? "#fee2e2" : "#f1f5f9"}
          iconColor={isTdsCut ? "#dc2626" : "#64748b"}
          label="TDS Deducted"
          value={fmt(tdsDeducted)}
          sub="Section 194H (5%)"
          badge={
            isTdsCut
              ? { text: "TDS Cut: Yes (5%)", bg: "bg-red-100", color: "text-red-700" }
              : { text: "TDS Cut: No", bg: "bg-slate-100", color: "text-slate-600" }
          }
        />

        <KpiCard
          icon={FiArrowUpRight}
          iconBg="#e0e7ff"
          iconColor="#4f46e5"
          label="Net Earnings Credited"
          value={fmt(netEarned)}
          sub="Post TDS/TCS net credited"
        />

        <KpiCard
          icon={FiCheckCircle}
          iconBg="#d1fae5"
          iconColor="#059669"
          label="Total Paid / Settled"
          value={fmt(totalPaid)}
          sub="Disbursed to Bank A/C"
          badge={{ text: "Paid", bg: "bg-emerald-100", color: "text-emerald-700" }}
        />

        <KpiCard
          icon={FiClock}
          iconBg="#fef3c7"
          iconColor="#d97706"
          label="Pending Payouts"
          value={fmt(pendingHolds)}
          sub="In settlement process"
          badge={pendingHolds > 0 ? { text: "Pending", bg: "bg-amber-100", color: "text-amber-800" } : null}
        />

        <KpiCard
          icon={FiDollarSign}
          iconBg="#dbeafe"
          iconColor="#2563eb"
          label="Available Balance"
          value={fmt(availBalance)}
          sub="Ready for next settlement"
        />
      </div>

      {/* ── Balance Breakdown & Audit Summary ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FiInfo size={16} className="text-blue-600 shrink-0" />
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Earnings Settlement Formula
            </h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Gross Commissions &amp; Margins</span>
              <span className="font-bold text-emerald-600 tabular-nums">+{fmt(grossEarned)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">− TDS Deduction (5% Sec. 194H)</span>
              <span className="font-bold text-red-500 tabular-nums">-{fmt(tdsDeducted)}</span>
            </div>
            {tcsDeducted > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">− GST TCS (0.5% - 1%)</span>
                <span className="font-bold text-red-400 tabular-nums">-{fmt(tcsDeducted)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 font-bold border-b border-slate-200 bg-slate-50 px-2 rounded-lg">
              <span className="text-slate-900">Net Earned Credited</span>
              <span className="text-blue-700 tabular-nums font-black">{fmt(netEarned)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">− Completed / Paid Bank Payouts</span>
              <span className="font-bold text-slate-700 tabular-nums">-{fmt(totalPaid)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600 font-medium">− Pending / Held Payouts</span>
              <span className="font-bold text-amber-600 tabular-nums">-{fmt(pendingHolds)}</span>
            </div>
            <div className="flex justify-between py-2 font-black text-sm bg-blue-50 border border-blue-200 px-3 rounded-xl">
              <span className="text-blue-950">Available Payout Balance</span>
              <span className="text-blue-700 tabular-nums">{fmt(availBalance)}</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Highlights */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FiFileText size={16} className="text-blue-600" />
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Payout &amp; Settlement Cycle
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Commission credits are automatically recorded in real-time when customer kit orders are dispatched or verified EPC leads convert.
              Admin processes settlements directly to your verified bank account on standard weekly/monthly payout cycles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Transactions</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{ledger.length}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Audit ledger records</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="text-[10px] font-extrabold uppercase text-emerald-700">Settlements Paid</div>
              <div className="text-lg font-black text-emerald-800 mt-0.5">{payouts.filter(p => p.status === 'paid').length}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Transferred to Bank</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
              <div className="text-[10px] font-extrabold uppercase text-amber-700">Pending Settlements</div>
              <div className="text-lg font-black text-amber-800 mt-0.5">{payouts.filter(p => p.status === 'pending' || p.status === 'processing').length}</div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5">In review / bank dispatch</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs: Transaction Ledger (History) & Settlement History ───────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-6 py-3 gap-3 bg-slate-50/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                activeTab === "ledger"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Earnings &amp; Transaction History ({ledger.length})
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                activeTab === "payouts"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Settlement &amp; Payout History ({payouts.length})
            </button>
          </div>

          {activeTab === "ledger" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Filter:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="commission_credit">Commission Credits</option>
                <option value="bonus">Incentive / Bonus</option>
                <option value="payout_debit">Payout Debits</option>
                <option value="adjustment">Admin Adjustments</option>
                <option value="refund">Reversals / Refunds</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Transaction Ledger (History) ────────────────────────────────── */}
        {activeTab === "ledger" && (
          loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-2 text-sm font-semibold">
              <FiLoader className="animate-spin text-blue-600" size={20} /> Loading earnings history...
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm font-semibold">
              No transactions recorded in statement yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-left">Date &amp; Time</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-left">Transaction Type</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-left">Narration / Description</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-right">Gross Amount</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-right">TDS Deducted</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-right">Net Credited</th>
                    <th className="px-5 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((l) => {
                    const gross = l.gross_amount_paise ? l.gross_amount_paise / 100 : Math.abs(l.amount || 0);
                    const tds = l.tds_amount_paise ? l.tds_amount_paise / 100 : 0;
                    const net = l.net_amount_paise ? l.net_amount_paise / 100 : l.amount;
                    const isCredit = (l.amount || 0) >= 0;

                    return (
                      <tr key={l.id || l._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {l.created_at
                            ? new Date(l.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                              isCredit
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {(l.transaction_type || "").replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 max-w-sm truncate" title={l.narration}>
                          {l.narration}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-600 font-bold tabular-nums">
                          {l.gross_amount_paise ? fmt(gross) : fmt(Math.abs(l.amount || 0))}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {tds > 0 ? (
                            <span className="text-red-600 font-bold tabular-nums">
                              -{fmt(tds)} <span className="text-[10px] text-red-500 font-semibold">(5%)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">No TDS Cut</span>
                          )}
                        </td>
                        <td className={`px-4 py-3.5 text-right font-black tabular-nums whitespace-nowrap ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                          {isCredit ? `+${fmt(net)}` : `-${fmt(Math.abs(net))}`}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 tabular-nums">
                          {fmt(l.balance_after || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Settlement & Payout History ─────────────────────────────────── */}
        {activeTab === "payouts" && (
          loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-2 text-sm font-semibold">
              <FiLoader className="animate-spin text-blue-600" size={20} /> Loading payout settlements...
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm font-semibold">
              No payout settlements recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-left">Payout ID</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-right">Settled Amount</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-left">Bank Details</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-center">Status</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-left">Bank UTR / Reference</th>
                    <th className="px-4 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-right">Requested Date</th>
                    <th className="px-5 py-3.5 font-extrabold text-slate-600 uppercase tracking-wider text-right">Paid / Processed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((p) => {
                    const amount = p.amount_paise ? p.amount_paise / 100 : p.amount;
                    return (
                      <tr key={p.id || p._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px] font-bold">
                          #{String(p.id || p._id || "").slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-blue-700 text-sm tabular-nums">
                          {fmt(amount)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          <div className="font-bold">{p.bank_details_snapshot?.bank_name || "Primary Bank Account"}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            A/C: {p.bank_details_snapshot?.account_number || "—"} · IFSC: {p.bank_details_snapshot?.ifsc_code || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px]">
                          {p.utr_reference || p.transaction_reference ? (
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                              {p.utr_reference || p.transaction_reference}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-500 whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-500 whitespace-nowrap font-bold">
                          {p.processed_at ? new Date(p.processed_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
