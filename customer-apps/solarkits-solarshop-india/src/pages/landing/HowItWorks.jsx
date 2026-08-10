import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiMapPin, FiShoppingCart, FiTruck, FiCheckCircle } from "react-icons/fi";

const STEPS = [
  { step: "01", icon: FiMapPin, title: "Choose Your State/District", description: "Select your state and district to see solar kits available in your area with live inventory and district-specific pricing.", color: "#1a3b8b", bg: "#eff6ff", border: "#bfdbfe" },
  { step: "02", icon: FiShoppingCart, title: "Pick Your Solar Kit", description: "Browse pre-configured combo kits or customize your own. Compare panels, inverters, and battery options.", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { step: "03", icon: FiTruck, title: "Order & Track", description: "Place your order securely online. Get real-time delivery tracking and GST invoice instantly.", color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
  { step: "04", icon: FiCheckCircle, title: "Enjoy Saving & Repeat", description: "Certified products arrive at your doorstep. Connect with our installation partner network and start saving.", color: "#15803d", bg: "#f0fdf4", border: "#86efac" },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.18 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{ background: "#f0f6ff", padding: "96px 28px", position: "relative", overflow: "hidden" }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 30 }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: "72px" }}
        >
          <div style={{ display: "inline-block", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: "50px", padding: "5px 14px", marginBottom: "16px" }}>
            <span style={{ color: "#7c3aed", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em" }}>SIMPLE PROCESS</span>
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: "#0f172a",
            fontFamily: "'Outfit', sans-serif", marginBottom: "16px", lineHeight: 1.2,
          }}>
            Save with Solarkits{" "}
            <span style={{ background: "linear-gradient(135deg, #f8c21a, #f59e0b)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              in 4 Easy Steps
            </span>
          </h2>

        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", position: "relative" }}>
          {/* Connector line — desktop */}
          <div className="landing-hide-mobile" style={{
            position: "absolute", top: "52px",
            left: "calc(12.5% + 26px)", right: "calc(12.5% + 26px)",
            height: "2px",
            background: "linear-gradient(90deg, #bfdbfe, #fde68a, #99f6e4, #86efac)",
            pointerEvents: "none", zIndex: 0, borderRadius: "2px",
          }} />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: active ? 1 : 0, y: active ? 0 : 40 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
                style={{ textAlign: "center", position: "relative", zIndex: 1 }}
              >
                {/* Step circle */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 6 }}
                  style={{
                    width: "72px", height: "72px", borderRadius: "50%",
                    background: step.bg, border: `2.5px solid ${step.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 24px",
                    boxShadow: `0 8px 24px ${step.color}18`,
                    position: "relative",
                    transition: "box-shadow 0.3s",
                  }}
                >
                  <Icon style={{ fontSize: "1.6rem", color: step.color }} />
                  {/* Number badge */}
                  <div style={{
                    position: "absolute", top: "-6px", right: "-6px",
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: step.color, color: "#fff",
                    fontSize: "0.65rem", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </div>
                </motion.div>

                <div style={{ color: step.color, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "10px" }}>
                  STEP {step.step}
                </div>
                <h3 style={{ color: "#0f172a", fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px", fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>
                  {step.title}
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.75, maxWidth: "240px", margin: "0 auto" }}>
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
