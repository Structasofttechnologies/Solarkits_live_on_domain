import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiTruck, FiAward, FiHeadphones, FiShield, FiZap } from "react-icons/fi";

const FEATURES = [
  { icon: FiAward, title: "BIS & MNRE Certified", description: "Every product is certified by BIS and MNRE. Only government-approved manufacturers in our catalog.", color: "#1a3b8b", bg: "#eff6ff" },
  { icon: FiZap, title: "Bulk Purchase Rate", description: "Direct tie-ups with tier-1 manufacturers mean factory-direct pricing without any middlemen markup.", color: "#d97706", bg: "#fffbeb" },
  { icon: FiTruck, title: "Pan-India Delivery", description: "We deliver to 28+ states. Orders before 2 PM ship the same day with real-time tracking.", color: "#0d9488", bg: "#f0fdfa" },
  { icon: FiHeadphones, title: "Save On GST", description: "Certified solar engineers available before and after purchase via WhatsApp and phone support.", color: "#7c3aed", bg: "#f5f3ff" },

];

export default function WhyChooseSection() {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);

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
      id="why-choose"
      ref={sectionRef}
      style={{ background: "#ffffff", padding: "96px 28px", position: "relative", overflow: "hidden" }}
    >
      {/* Subtle background shapes */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "400px", height: "400px", background: "radial-gradient(circle, rgba(248,194,26,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "300px", height: "300px", background: "radial-gradient(circle, rgba(26,59,139,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 30 }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: "64px" }}
        >
          <div style={{ display: "inline-block", background: "#dcfce7", border: "1px solid #86efac", borderRadius: "50px", padding: "5px 14px", marginBottom: "16px" }}>
            <span style={{ color: "#15803d", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em" }}>WHY CHOOSE US</span>
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: "#0f172a",
            fontFamily: "'Outfit', sans-serif", marginBottom: "16px", lineHeight: 1.2,
          }}>
            Everything You Need to Go Solar —{" "}
            <span style={{ background: "linear-gradient(135deg, #f8c21a, #f59e0b)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              All in One Platform
            </span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: "540px", margin: "0 auto", lineHeight: 1.7 }}>
            SolarKits is more than a marketplace. We're your end-to-end partner in the solar journey.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: active ? 1 : 0, y: active ? 0 : 40 }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                style={{
                  background: "#fff",
                  borderRadius: "20px", padding: "32px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                  border: "1.5px solid #f1f5f9",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = `0 20px 50px ${feature.color}18`;
                  e.currentTarget.style.borderColor = `${feature.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  background: feature.bg, border: `1px solid ${feature.color}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "20px", transition: "transform 0.3s",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1) rotate(5deg)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1) rotate(0deg)"}
                >
                  <Icon style={{ fontSize: "1.5rem", color: feature.color }} />
                </div>
                <h3 style={{ color: "#0f172a", fontSize: "1.05rem", fontWeight: 700, marginBottom: "10px", fontFamily: "'Outfit', sans-serif" }}>
                  {feature.title}
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.75 }}>
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
