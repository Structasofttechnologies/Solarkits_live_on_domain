import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiShield, FiLock, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import Navbar from "../landingPage/Navbar";
import Footer from "../landingPage/Footer";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Privacy Policy — Solarkits.in";
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
            <FiShield /> LEGAL & COMPLIANCE
          </div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Last Updated: August 2026 • Applies to all buyers, customers, and EPC partners on Solarkits.in.
          </p>
        </div>

        {/* Notice Box: E-Commerce & No Installation Disclaimer */}
        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <FiAlertTriangle style={{ color: "#b45309", fontSize: "1.5rem", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.92rem", color: "#92400e", lineHeight: 1.6 }}>
            <strong>Important Platform Note:</strong> Solarkits.in operates strictly as an <strong>E-Commerce Supply Marketplace</strong> for solar panels, combo kits, BOS equipment, and solar products. <strong>We DO NOT provide on-site installation, EPC engineering, or labor services.</strong> All products are supplied directly to your delivery address for independent assembly or local installation.
          </div>
        </div>

        {/* Policy Content Sections */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "40px", lineHeight: 1.8, fontSize: "1rem", color: "#334155" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginTop: 0, marginBottom: "12px" }}>
            1. Information We Collect
          </h2>
          <p style={{ marginBottom: "20px" }}>
            Solarkits.in ("Solarkits", "We", "Us") collects customer information strictly necessary to process online e-commerce purchases, dispatch solar panel orders, issue GST tax invoices, and facilitate logistics across India.
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "28px" }}>
            <li><strong>Account & Buyer Information:</strong> Full name, company name, GSTIN (optional for tax claims), email address, phone number, shipping and billing address.</li>
            <li><strong>Transactional Data:</strong> Order history, selected solar combo kits, component quantities, and payment gateway confirmation IDs.</li>
            <li><strong>Platform Analytics:</strong> IP address, browser specs, and session telemetry to maintain e-commerce platform security.</li>
          </ul>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            2. How We Use Your Data
          </h2>
          <p style={{ marginBottom: "20px" }}>
            Your personal information is used exclusively for:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "28px" }}>
            <li>Processing solar panel & BOS product orders and issuing official tax-compliant invoices.</li>
            <li>Coordinating warehouse logistics, freight dispatch, and delivery tracking notifications.</li>
            <li>Enabling manufacturer warranty validation for Tier-1 solar panels & grid inverters.</li>
            <li>Ensuring secure payments and preventing fraudulent online transactions.</li>
          </ul>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            3. Data Security & Payment Protection
          </h2>
          <p style={{ marginBottom: "28px" }}>
            Solarkits.in employs industry-standard 256-bit SSL encryption. All online payments are securely processed through PCI-DSS compliant payment gateways (Razorpay/Bank Transfer). Solarkits does not store your credit card, debit card, or net-banking credentials on our servers.
          </p>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            4. Contact Privacy Compliance
          </h2>
          <p style={{ margin: 0 }}>
            If you have questions regarding your personal data or wish to update your account preferences, please reach out to our team at <strong>support@solarkits.in</strong>.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
