import { useState, useEffect } from "react";
import Navbar from "./landing/Navbar";
import HeroSection from "./landing/HeroSection";
import StatsSection from "./landing/StatsSection";
import ProductsSection from "./landing/ProductsSection";
import WhyChooseSection from "./landing/WhyChooseSection";
import HowItWorks from "./landing/HowItWorks";
import TestimonialsSection from "./landing/TestimonialsSection";
import CtaBanner from "./landing/CtaBanner";
import FooterSection from "./landing/FooterSection";
import { getWebsiteLandingContent } from "../services/websiteContentService";

// Ticker / Marquee bar — trusted brands
const DEFAULT_TICKER = [
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

function TickerBar({ tickerItems }) {
  const list = tickerItems && tickerItems.length > 0 ? tickerItems : DEFAULT_TICKER;
  const items = [...list, ...list];

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
  const [dynamicContent, setDynamicContent] = useState(null);

  useEffect(() => {
    document.title = "SolarKits India — Buy Certified Solar Kits Online";

    getWebsiteLandingContent()
      .then((data) => {
        if (data) {
          setDynamicContent(data);
        }
      })
      .catch((err) => console.warn("Dynamic content load error:", err));
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', 'Outfit', system-ui, sans-serif", background: "#fff", color: "#0f172a" }}>
      {/* Fixed Navigation */}
      <Navbar />

      {/* Hero — Full viewport */}
      <HeroSection heroConfig={dynamicContent?.hero} />

      {/* Scrolling ticker below hero */}
      <TickerBar tickerItems={dynamicContent?.ticker?.items} />

      {/* Stats — Social proof numbers */}
      <StatsSection statsConfig={dynamicContent?.stats} />

      {/* Products — Kit categories */}
      <ProductsSection productsConfig={dynamicContent?.products} />

      {/* Why Choose — Feature grid */}
      <WhyChooseSection whyChooseConfig={dynamicContent?.why_choose} />

      {/* How It Works — 4-step process */}
      <HowItWorks howItWorksConfig={dynamicContent?.how_it_works} />

      {/* Testimonials — Customer carousel */}
      <TestimonialsSection testimonialsConfig={dynamicContent?.testimonials} />

      {/* CTA Banner — Conversion */}
      <CtaBanner ctaConfig={dynamicContent?.cta_banner} />

      {/* Footer */}
      <FooterSection footerConfig={dynamicContent?.footer} />
    </div>
  );
}
