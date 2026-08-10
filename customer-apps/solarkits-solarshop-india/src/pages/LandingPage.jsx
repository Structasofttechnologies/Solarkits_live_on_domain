import { useEffect } from "react";
import Navbar from "./landing/Navbar";
import HeroSection from "./landing/HeroSection";
import StatsSection from "./landing/StatsSection";
import ProductsSection from "./landing/ProductsSection";
import WhyChooseSection from "./landing/WhyChooseSection";
import HowItWorks from "./landing/HowItWorks";
import TestimonialsSection from "./landing/TestimonialsSection";
import CtaBanner from "./landing/CtaBanner";
import FooterSection from "./landing/FooterSection";

// Ticker / Marquee bar — trusted brands
const TICKER_ITEMS = [
  "⚡ BIS Certified Products",
  "☀️ Tier-1 Solar Panels",
  "🔋 Lithium & Lead-Acid Batteries",
  "🔌 String & Microinverters",
  "📦 Same-Day Dispatch",
  "🇮🇳 Made in India Options",
  "💳 100% Secure Payments",
  "📋 GST Invoice Provided",
  "🌿 PM-KUSUM Subsidy Eligible",
  "🛡️ MNRE Approved Brands",
];

function TickerBar() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a3b8b, #1d4ed8)",
      overflow: "hidden",
      height: "40px",
      display: "flex",
      alignItems: "center",
      position: "relative",
      zIndex: 10,
    }}>
      {/* Left fade */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "80px",
        background: "linear-gradient(90deg, #1a3b8b, transparent)",
        zIndex: 1,
      }} />

      <div
        className="animate-marquee"
        style={{
          display: "flex",
          gap: "0",
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              padding: "0 28px",
              color: "rgba(255,255,255,0.9)",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              borderRight: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {item}
          </span>
        ))}
      </div>

      {/* Right fade */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: "80px",
        background: "linear-gradient(270deg, #1d4ed8, transparent)",
        zIndex: 1,
      }} />
    </div>
  );
}

export default function LandingPage() {
  useEffect(() => {
    document.title = "SolarKits India — Buy Certified Solar Kits Online";
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', 'Outfit', system-ui, sans-serif", background: "#fff", color: "#0f172a" }}>
      {/* Fixed Navigation */}
      <Navbar />

      {/* Hero — Full viewport */}
      <HeroSection />

      {/* Scrolling ticker below hero */}
      <TickerBar />

      {/* Stats — Social proof numbers */}
      <StatsSection />

      {/* Products — Kit categories */}
      <ProductsSection />

      {/* Why Choose — Feature grid */}
      <WhyChooseSection />

      {/* How It Works — 4-step process */}
      <HowItWorks />

      {/* Testimonials — Customer carousel */}
      <TestimonialsSection />

      {/* CTA Banner — Conversion */}
      <CtaBanner />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
