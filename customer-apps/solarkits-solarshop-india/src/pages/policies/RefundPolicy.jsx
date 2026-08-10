import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import Navbar from "../landing/Navbar";
import FooterSection from "../landing/FooterSection";

export default function RefundPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Refund & Cancellation Policy — Solarkits.in";
  }, []);

  return (
    <div style={{ background: "#f8fafc", color: "#0f172a", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <div style={{ paddingTop: "110px", paddingBottom: "80px", maxWidth: "900px", margin: "0 auto", paddingLeft: "24px", paddingRight: "24px" }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#1e3a8a",
            cursor: "pointer",
            marginBottom: "28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <FiArrowLeft /> Back to Home
        </button>

        {/* Header Title */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "36px 40px", marginBottom: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#2563eb", background: "#eff6ff", padding: "6px 14px", borderRadius: "50px", fontSize: "0.82rem", fontWeight: 700, marginBottom: "16px" }}>
            <FiRefreshCw /> GUARANTEED EQUIPMENT PROTECTION
          </div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>
            Refund & Cancellation Policy
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Clear, transparent guidelines on e-commerce returns, transit damage claims, and order cancellations.
          </p>
        </div>

        {/* Notice Box: E-Commerce & No Installation Disclaimer */}
        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <FiAlertTriangle style={{ color: "#b45309", fontSize: "1.5rem", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.92rem", color: "#92400e", lineHeight: 1.6 }}>
            <strong>E-Commerce Supply Policy:</strong> Solarkits.in is an <strong>E-Commerce Marketplace</strong> delivering solar panels and equipment across India. <strong>We do not provide installation or field labor services.</strong> Returns and replacements apply to product delivery, manufacturing defects, or transit damage as detailed below.
          </div>
        </div>

        {/* Policy Content Sections */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "40px", lineHeight: 1.8, fontSize: "1rem", color: "#334155" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginTop: 0, marginBottom: "12px" }}>
            1. Order Cancellation Policy
          </h2>
          <p style={{ marginBottom: "24px" }}>
            Solar panel & equipment orders on Solarkits.in may be cancelled with a 100% full refund before dispatch from our regional warehouse hubs. Once goods have been handed over to freight carriers or dispatched, standard transit charges may apply.
          </p>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            2. Transit Damage & Defect Replacement
          </h2>
          <p style={{ marginBottom: "24px" }}>
            All Solarkits shipments carry 100% full transit insurance. In the rare event of glass damage, micro-cracks, or physical defects upon arrival:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "28px" }}>
            <li>Please record an unboxing video or capture clear photos during truck unloading.</li>
            <li>Notify Solarkits support within 48 hours of delivery at <strong>support@solarkits.in</strong>.</li>
            <li>We issue expedited free replacements for damaged modules, inverters, or components.</li>
          </ul>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            3. Refund Timelines
          </h2>
          <p style={{ margin: 0 }}>
            Approved refunds are credited directly to the original payment method or bank account within <strong>5–7 business days</strong>.
          </p>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
