import React, { useState } from "react";
import {
  FaCreditCard, FaFileInvoice, FaShieldAlt, FaCheckCircle,
  FaTimesCircle, FaUndo, FaMoneyBillWave, FaClock, FaCalendarAlt
} from "react-icons/fa";
import Dialog from "../Dialog";
import Button from "../Button";
import CustomInput from "../CustomInput";

export default function SupplierPaymentModal({
  isOpen,
  onClose,
  purchaseIndent,
  userRole = "Accounts", // 'Accounts' | 'Admin'
  onRequestPayment,
  onAdminApproval,
  onRecordBankPayment,
  loading
}) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'request' | 'admin_approval' | 'bank_record'
  const [remarks, setRemarks] = useState("");
  const [adminAction, setAdminAction] = useState("approve"); // 'approve' | 'reject' | 'return'
  
  // Bank record states
  const [utrNumber, setUtrNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("RTGS");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isOpen || !purchaseIndent) return null;

  const payment = purchaseIndent.payment || {};
  const paymentStatus = payment.payment_status || "PI Submitted";
  const advanceAmount = payment.advance_amount || Math.round((purchaseIndent.total_pi_value * 0.3));

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    onRequestPayment({
      pi_id: purchaseIndent._id,
      remarks: remarks || "Supplier payment requested for Admin approval"
    });
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    onAdminApproval({
      pi_id: purchaseIndent._id,
      action: adminAction,
      remarks: remarks || `Payment request ${adminAction}d by Admin`
    });
  };

  const handleBankRecordSubmit = (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      alert("UTR Number is required.");
      return;
    }
    onRecordBankPayment({
      pi_id: purchaseIndent._id,
      utr_number: utrNumber.trim().toUpperCase(),
      paid_amount: Number(paidAmount) || advanceAmount,
      payment_mode: paymentMode,
      payment_date: paymentDate
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Supplier Payment Card — PI #${purchaseIndent.pi_number}`} size="lg">
      <div className="space-y-4 p-1 text-text-primary">
        
        {/* Status Tracker Bar */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
              Customer Order & Supplier
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-black text-text-primary">
                Order #{purchaseIndent.customer_order_number}
              </span>
              <span className="text-xs font-bold text-text-muted">•</span>
              <span className="text-xs font-bold text-primary">
                {purchaseIndent.supplier_name}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
              Payment Status
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mt-0.5 border ${
              paymentStatus === "Approved" || paymentStatus === "Paid"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : paymentStatus === "Awaiting Admin Approval"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse"
                  : paymentStatus.includes("Rejected")
                    ? "bg-red-500/10 text-red-600 border-red-500/30"
                    : "bg-blue-500/10 text-blue-600 border-blue-500/30"
            }`}>
              <FaCreditCard className="text-xs" />
              {paymentStatus}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border text-xs font-bold gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "overview" ? "border-primary text-primary font-black" : "border-transparent text-text-muted"
            }`}
          >
            Payment Terms Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("request")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "request" ? "border-primary text-primary font-black" : "border-transparent text-text-muted"
            }`}
          >
            Initiate Payment Request
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("admin_approval")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "admin_approval" ? "border-primary text-primary font-black" : "border-transparent text-text-muted"
            }`}
          >
            Admin Approval View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank_record")}
            className={`py-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "bank_record" ? "border-primary text-primary font-black" : "border-transparent text-text-muted"
            }`}
          >
            Record Bank Payment
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg border border-border rounded-xl p-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase block">Total PI Value</span>
                <span className="text-sm font-black text-text-primary">
                  ₹{(purchaseIndent.total_pi_value || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase block">
                  Advance ({payment.advance_percentage || 30}%)
                </span>
                <span className="text-sm font-black text-primary">
                  ₹{advanceAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase block">
                  Balance ({payment.balance_percentage || 70}%)
                </span>
                <span className="text-sm font-black text-text-primary">
                  ₹{(payment.balance_amount || (purchaseIndent.total_pi_value - advanceAmount)).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase block">Production / TAT</span>
                <span className="text-sm font-black text-text-primary">
                  {payment.production_tat_days || 5} + {payment.supply_tat_days || 3} Days
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-3.5 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Configured Supplier Payment Terms
              </h4>
              <p className="text-xs text-text-muted">
                {payment.payment_terms || "30% Advance at order placement, 70% against dispatch inspection report."}
              </p>
              {payment.admin_approval?.remarks && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs">
                  <strong className="text-amber-700 dark:text-amber-400">Admin Remarks: </strong>
                  <span className="text-text-primary">{payment.admin_approval.remarks}</span>
                </div>
              )}
              {payment.actual_payment?.utr_number && (
                <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
                  <strong className="text-emerald-700 dark:text-emerald-400">Recorded Bank UTR: </strong>
                  <span className="font-mono font-bold text-text-primary">{payment.actual_payment.utr_number}</span>
                  <span className="text-text-muted ml-2">({payment.actual_payment.payment_mode} • ₹{payment.actual_payment.paid_amount?.toLocaleString("en-IN")})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INITIATE PAYMENT REQUEST (Accounts Role) */}
        {activeTab === "request" && (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs leading-relaxed text-text-primary">
              <strong className="text-primary block mb-0.5">Payment Request Workflow:</strong>
              Submitting this request alerts the Admin login for official review. Admin must approve before bank disbursement is processed.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                  Requested Advance Amount (₹)
                </label>
                <div className="p-2.5 bg-bg border border-border rounded-xl text-sm font-black text-primary">
                  ₹{advanceAmount.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                  Payment Terms
                </label>
                <div className="p-2.5 bg-bg border border-border rounded-xl text-xs font-bold text-text-primary">
                  {payment.payment_terms || "30% Advance"}
                </div>
              </div>
            </div>

            <CustomInput
              label="Accounts Remarks / Verification Notes"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Proforma invoice verified against agreed BOM quote. Requesting advance approval."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || paymentStatus === "Awaiting Admin Approval"}
              >
                {loading ? "Submitting..." : "Submit to Admin for Approval"}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 3: ADMIN APPROVAL VIEW (Admin Role) */}
        {activeTab === "admin_approval" && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-text-primary">
              <div className="flex items-center gap-1.5 font-black text-amber-700 dark:text-amber-400 mb-1">
                <FaShieldAlt /> Admin Approval Governance
              </div>
              <p className="leading-relaxed">
                Admin review of PI Value (₹{(purchaseIndent.total_pi_value || 0).toLocaleString("en-IN")}), Payment Terms, and supplier eligibility. Approving this does NOT automatically disburse funds or mark materials as received.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text-muted uppercase block">
                Approval Action *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAdminAction("approve")}
                  className={`p-3 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    adminAction === "approve"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-surface text-text-muted border-border hover:border-emerald-500/50"
                  }`}
                >
                  <FaCheckCircle /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => setAdminAction("return")}
                  className={`p-3 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    adminAction === "return"
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                      : "bg-surface text-text-muted border-border hover:border-amber-500/50"
                  }`}
                >
                  <FaUndo /> Return for Rework
                </button>
                <button
                  type="button"
                  onClick={() => setAdminAction("reject")}
                  className={`p-3 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    adminAction === "reject"
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-surface text-text-muted border-border hover:border-red-500/50"
                  }`}
                >
                  <FaTimesCircle /> Reject
                </button>
              </div>
            </div>

            <CustomInput
              label="Admin Remarks / Justification *"
              required
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Terms approved as per contract. Proceed with ICICI / RTGS advance."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Processing..." : `Confirm ${adminAction.toUpperCase()}`}
              </Button>
            </div>
          </form>
        )}

        {/* TAB 4: RECORD BANK PAYMENT */}
        {activeTab === "bank_record" && (
          <form onSubmit={handleBankRecordSubmit} className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-text-primary">
              <strong className="text-emerald-700 dark:text-emerald-400 block mb-0.5">
                Bank Disbursement Logging:
              </strong>
              Record official bank UTR reference and amount paid after Admin approval.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="Bank UTR Number / Reference *"
                required
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. ICICR20261014000123"
              />
              <CustomInput
                label="Amount Paid (₹) *"
                type="number"
                required
                min="1"
                value={paidAmount || advanceAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              />
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-2.5 bg-bg border border-border rounded-xl text-xs font-bold text-text-primary"
                >
                  <option value="RTGS">RTGS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="ICICI eCollection">ICICI eCollection</option>
                  <option value="IMPS">IMPS</option>
                  <option value="NetBanking">NetBanking</option>
                </select>
              </div>
              <CustomInput
                label="Payment Date *"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Recording..." : "Record Actual Payment"}
              </Button>
            </div>
          </form>
        )}

      </div>
    </Dialog>
  );
}
