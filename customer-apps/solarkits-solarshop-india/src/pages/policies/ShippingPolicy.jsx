import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTruck, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import Navbar from "../landing/Navbar";
import FooterSection from "../landing/FooterSection";

export default function ShippingPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Shipping & Delivery Policy — Solarkits.in";
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
            <FiTruck /> PAN-INDIA E-COMMERCE FREIGHT
          </div>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>
            Shipping & Delivery Policy
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Fast, insured freight shipping covering 28 Indian States & Union Territories.
          </p>
        </div>

        {/* Notice Box */}
        <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <FiAlertTriangle style={{ color: "#b45309", fontSize: "1.5rem", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.92rem", color: "#92400e", lineHeight: 1.6 }}>
            <strong>Direct Freight Supply:</strong> Solarkits.in delivers solar panels and equipment to your specified address or regional warehouse. <strong>We do not provide installation or unloading labor services at site.</strong> Receiver or contractor must arrange unloading and local installation independently.
          </div>
        </div>

        {/* Policy Content Sections */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "40px", lineHeight: 1.8, fontSize: "1rem", color: "#334155" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginTop: 0, marginBottom: "12px" }}>
            1. Dispatch Timelines
          </h2>
          <p style={{ marginBottom: "24px" }}>
            In-stock solar combo kits and components are dispatched from our nearest regional warehouse hub within <strong>24 to 48 hours</strong> of order payment confirmation.
          </p>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            2. Transit Duration Across India
          </h2>
          <ul style={{ paddingLeft: "20px", marginBottom: "28px" }}>
            <li><strong>Tier-1 Cities & Metro Hubs:</strong> 2 – 4 Business Days</li>
            <li><strong>Tier-2 / Tier-3 Districts:</strong> 4 – 7 Business Days</li>
            <li><strong>Remote Farmlands & North-East / Hilly Regions:</strong> 7 – 10 Business Days</li>
          </ul>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
            3. Freight Tracking & Full Transit Insurance
          </h2>
          <p style={{ margin: 0 }}>
            Every shipment includes SMS/Email tracking updates and 100% full transit insurance protection against loss or damage during transport.
          </p>
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
