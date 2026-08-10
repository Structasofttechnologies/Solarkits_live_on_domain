import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: 5000, suffix: "+", label: "Kits Supplied", icon: "☀️", color: "#1a3b8b", bg: "#eff6ff" },
  { value: 28, suffix: "", label: "States Covered", icon: "🗺️", color: "#0d9488", bg: "#f0fdfa" },
  { value: 50, prefix: "₹", suffix: "Cr+", label: "Client Savings", icon: "💰", color: "#d97706", bg: "#fffbeb" },
];

function useCountUp(end, duration = 2000, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, active]);
  return count;
}

function StatCard({ stat, index, active }) {
  const count = useCountUp(stat.value, 2000 + index * 150, active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 40 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "32px 28px",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        border: "1px solid #f1f5f9",
        transition: "all 0.35s ease",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 16px 48px ${stat.color}22`; e.currentTarget.style.borderColor = `${stat.color}30`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "4px",
        background: `linear-gradient(90deg, ${stat.color}, ${stat.color}80)`,
      }} />

      {/* Icon circle */}
      <div style={{
        width: "60px", height: "60px", borderRadius: "16px",
        background: stat.bg, margin: "0 auto 16px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.8rem",
      }}>
        {stat.icon}
      </div>

      {/* Number */}
      <div style={{
        fontSize: "clamp(2.2rem, 3.5vw, 3rem)", fontWeight: 900,
        color: stat.color, lineHeight: 1, marginBottom: "8px",
        fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em",
      }}>
        {stat.prefix || ""}{count.toLocaleString()}{stat.suffix}
      </div>

      {/* Label */}
      <div style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: 600 }}>
        {stat.label}
      </div>
    </motion.div>
  );
}

export default function StatsSection() {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        background: "#f8faff",
        padding: "88px 28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 24 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "56px" }}
        >
          <div style={{
            display: "inline-block", background: "#eff6ff",
            border: "1px solid #bfdbfe", borderRadius: "50px",
            padding: "5px 14px", marginBottom: "16px",
          }}>
            <span style={{ color: "#1d4ed8", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em" }}>
              OUR IMPACT
            </span>
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800,
            color: "#0f172a", fontFamily: "'Outfit', sans-serif",
            marginBottom: "12px", lineHeight: 1.2,
          }}>
            Trusted by Solar Businesses Across India
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: "500px", margin: "0 auto" }}>
            Numbers that reflect our commitment to affordable, reliable solar solutions
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}>
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
