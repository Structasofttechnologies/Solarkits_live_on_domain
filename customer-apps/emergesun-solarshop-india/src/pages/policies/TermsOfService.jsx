import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import Navbar from "../landing/Navbar";
import FooterSection from "../landing/FooterSection";

export default function TermsOfService() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Terms of Service & User Policy — Solarkits.in";
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
            <FiFileText /> E-COMMERCE TERMS & CONDITIONS
          </div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>
            Terms of Service & User Policy
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Effective Date: August 2026 • Governing E-Commerce Purchases, Product Supply, & Marketplace Usage.
          </p>
        </div>

        {/* Notice Box: E-Commerce & No Installation Disclaimer */}
        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <FiAlertTriangle style={{ color: "#b45309", fontSize: "1.5rem", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.92rem", color: "#92400e", lineHeight: 1.6 }}>
            <strong>CRITICAL SERVICE DISCLAIMER:</strong> Solarkits.in is strictly an <strong>Online E-Commerce Product Supply Platform</strong>. We sell and deliver solar panels, solar combo kits, BOS components, and accessories across India. <strong>Solarkits DOES NOT offer, undertake, or provide installation services, EPC labor, on-site mounting, or maintenance.</strong> Product installation must be arranged independently by the customer or qualified local technicians.
          </div>
        </div>

        {/* Policy Content Sections */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "40px", lineHeight: 1.8, fontSize: "1rem", color: "#334155" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginTop: 0, marginBottom: "12px" }}>
            1. E-Commerce Platform & Order Acceptance
          </h2>
          <p style={{ marginBottom: "24px" }}>
            Solarkits.in enables retail and wholesale customers to browse, customize, and buy solar panels and equipment online. By placing an order on Solarkits.in, you agree that you are purchasing physical solar goods for independent usage or installation.
          </p>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            2. Product Quality & Manufacturer Warranties
          </h2>
          <p style={{ marginBottom: "24px" }}>
            All Tier-1 solar panels, grid-tied/hybrid inverters, solar pump controllers, and BOS components sold on Solarkits.in carry authentic manufacturer warranties and conform to Bureau of Indian Standards (BIS) and MNRE guidelines. Solarkits passes all original manufacturer warranties directly to the buyer.
          </p>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            3. Pricing, GST Invoicing, & Payments
          </h2>
          <p style={{ marginBottom: "24px" }}>
            Product prices are displayed in Indian Rupees (INR) and may be subject to applicable GST rates. Official GST Tax Invoices are issued upon order dispatch, allowing eligible business buyers to claim Input Tax Credit (ITC).
          </p>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            4. Exclusion of Installation Liability
          </h2>
          <p style={{ marginBottom: "24px" }}>
            Because Solarkits operates exclusively as a product supply e-commerce marketplace:
          </p>
          <ul style={{ paddingLeft: "20px", marginBottom: "28px" }}>
            <li>Solarkits is not responsible for installation workmanship, rooftop structural modifications, or electrical wiring conducted by third parties.</li>
            <li>Local DISCOM net-metering applications, approvals, or rooftop structural safety certificates remain the responsibility of the customer/installer.</li>
            <li>Warranties cover product manufacturing defects only as defined by respective brand manufacturers.</li>
          </ul>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            5. Contact Support
          </h2>
          <p style={{ margin: 0 }}>
            For queries regarding orders, products, or terms of service, please contact our support team at <strong>support@solarkits.in</strong>.
          </p>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
