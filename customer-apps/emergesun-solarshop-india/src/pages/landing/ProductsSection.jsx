import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiPackage } from "react-icons/fi";

const FALLBACK_CATEGORIES = [
  { icon: "🏠", name: "Residential Kits", description: "1kW to 10kW systems — ideal for homes with premium panels and inverters.", tag: "Most Popular", tagColor: "#1a3b8b", tagBg: "#eff6ff" },
  { icon: "🏭", name: "Commercial Kits", description: "High-capacity systems for offices, factories, and large establishments.", tag: "Best Value", tagColor: "#0d9488", tagBg: "#f0fdfa" },
  { icon: "🌾", name: "Agricultural Kits", description: "Solar pump sets and agri-grade systems designed for rural deployment.", tag: "Subsidy Ready", tagColor: "#15803d", tagBg: "#f0fdf4" },
  { icon: "⚡", name: "Hybrid Systems", description: "Grid-tied + battery backup for uninterrupted power supply anytime.", tag: "New", tagColor: "#7c3aed", tagBg: "#f5f3ff" },
  { icon: "🔋", name: "Off-Grid Kits", description: "Complete standalone solar kits for remote areas without grid access.", tag: "Popular", tagColor: "#d97706", tagBg: "#fffbeb" },
  { icon: "📦", name: "Custom Combo Kits", description: "Mix and match panels, inverters, and batteries to build your perfect kit.", tag: "Flexible", tagColor: "#dc2626", tagBg: "#fff1f2" },
];

function ProductCard({ item, index, active }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 40 }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: "easeOut" }}
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        border: "1.5px solid #f1f5f9",
        transition: "all 0.3s ease",
        cursor: "default",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 20px 50px rgba(26,59,139,0.12)";
        e.currentTarget.style.borderColor = "#bfdbfe";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "#f1f5f9";
      }}
    >
      {item.tag && (
        <div style={{
          display: "inline-block", background: item.tagBg,
          border: `1px solid ${item.tagColor}30`,
          borderRadius: "50px", padding: "3px 12px",
          marginBottom: "14px",
          fontSize: "0.72rem", fontWeight: 700,
          color: item.tagColor, letterSpacing: "0.04em",
          alignSelf: "flex-start",
        }}>
          {item.tag}
        </div>
      )}
      <div style={{ fontSize: "2.8rem", marginBottom: "14px", lineHeight: 1 }}>{item.icon}</div>
      <h3 style={{ color: "#0f172a", fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", fontFamily: "'Outfit', sans-serif" }}>
        {item.name}
      </h3>
      <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "20px", flex: 1 }}>
        {item.description}
      </p>
      <div
        style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1a3b8b", fontSize: "0.85rem", fontWeight: 700, transition: "gap 0.2s", cursor: "pointer" }}
        onMouseEnter={(e) => e.currentTarget.style.gap = "10px"}
        onMouseLeave={(e) => e.currentTarget.style.gap = "6px"}
      >
        Browse Kits <FiArrowRight />
      </div>
    </motion.div>
  );
}

export default function ProductsSection() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="products"
      ref={sectionRef}
      style={{ background: "#f0f6ff", padding: "96px 28px", position: "relative", overflow: "hidden" }}
    >
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(26,59,139,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(248,194,26,0.08)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 30 }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: "64px" }}
        >
          <div style={{ display: "inline-block", background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "50px", padding: "5px 14px", marginBottom: "16px" }}>
            <span style={{ color: "#1d4ed8", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em" }}>OUR CATALOG</span>
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: "#0f172a",
            fontFamily: "'Outfit', sans-serif", marginBottom: "16px", lineHeight: 1.2,
          }}>
            Solar Kits for Every{" "}
            <span style={{ background: "linear-gradient(135deg, #1a3b8b, #3b82f6)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              Need & Scale
            </span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: "540px", margin: "0 auto", lineHeight: 1.7 }}>
            From small homes to large commercial installations — browse our complete range of pre-configured and custom solar combo kits.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "48px" }}>
          {categories.map((item, i) => (
            <ProductCard key={item.name} item={item} index={i} active={active} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ textAlign: "center" }}
        >
          <motion.button
            onClick={() => navigate("/auth/signup")}
            whileHover={{ scale: 1.04, boxShadow: "0 12px 32px rgba(26,59,139,0.3)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "15px 40px",
              background: "linear-gradient(135deg, #1a3b8b, #2563eb)",
              color: "#fff", borderRadius: "12px",
              fontSize: "1rem", fontWeight: 800, cursor: "pointer", border: "none",
              boxShadow: "0 6px 20px rgba(26,59,139,0.25)",
              fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: "8px",
            }}
          >
            <FiPackage />
            Browse All Solar Kits
            <FiArrowRight />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
