import { motion } from "framer-motion";
import { FiArrowRight, FiPhone } from "react-icons/fi";
import { FaSolarPanel } from "react-icons/fa";

export default function CtaBanner() {
  const handleRegister = () => {
    window.open("https://solarkits-reseller-portal.onrender.com", "_blank", "noopener,noreferrer");
  };

  const handleContact = () => {
    window.location.href = "mailto:support@solarkits.in";
  };

  return (
    <section
      style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #1a3b8b 0%, #1d4ed8 40%, #2563eb 70%, #1a3b8b 100%)",
        padding: "96px 28px",
      }}
    >
      {/* Background blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div className="animate-blob animate-float-slow" style={{
          position: "absolute", top: "-80px", right: "5%",
          width: "450px", height: "450px",
          background: "radial-gradient(circle, rgba(248,194,26,0.18) 0%, transparent 70%)",
          filter: "blur(50px)",
        }} />
        <div className="animate-blob animate-float-reverse" style={{
          position: "absolute", bottom: "-60px", left: "5%",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="animate-float"
          style={{
            display: "inline-flex", width: "72px", height: "72px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #f8c21a, #f59e0b)",
            alignItems: "center", justifyContent: "center",
            marginBottom: "28px",
            boxShadow: "0 12px 36px rgba(248,194,26,0.5)",
          }}
        >
          <FaSolarPanel style={{ fontSize: "2rem", color: "#0f172a" }} />
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, color: "#fff",
            fontFamily: "'Outfit', sans-serif", marginBottom: "20px", lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          Become Franchisee — Register Now
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            color: "rgba(255,255,255,0.78)", fontSize: "1.1rem",
            lineHeight: 1.7, marginBottom: "44px",
            maxWidth: "600px", margin: "0 auto 44px",
          }}
        >
          Join 5,000+ solar businesses and buyers sourcing certified equipment with SolarKits India.
          Partner with us for district-level franchise supply and pan-India logistics.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}
        >
          <motion.button
            onClick={handleRegister}
            whileHover={{ scale: 1.05, boxShadow: "0 16px 48px rgba(248,194,26,0.6)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 40px",
              background: "linear-gradient(135deg, #f8c21a, #f59e0b)",
              color: "#0f172a", borderRadius: "12px",
              fontSize: "1.05rem", fontWeight: 800, cursor: "pointer", border: "none",
              boxShadow: "0 8px 28px rgba(248,194,26,0.4)",
              display: "inline-flex", alignItems: "center", gap: "10px",
              fontFamily: "inherit",
            }}
          >
            Become a Partner <FiArrowRight />
          </motion.button>

          <motion.button
            onClick={handleContact}
            whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.25)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "16px 36px",
              background: "rgba(255,255,255,0.12)",
              color: "#fff", borderRadius: "12px",
              fontSize: "1rem", fontWeight: 600, cursor: "pointer",
              border: "1.5px solid rgba(255,255,255,0.35)",
              display: "inline-flex", alignItems: "center", gap: "10px",
              fontFamily: "inherit", backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}
          >
            <FiPhone /> Contact Support
          </motion.button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ display: "flex", gap: "28px", justifyContent: "center", marginTop: "36px", flexWrap: "wrap" }}
        >
          {["✓ Free Registration", "✓ No Minimum Order", "✓ GST Invoice Included", "✓ Pan-India Delivery"].map((item) => (
            <span key={item} style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", fontWeight: 500 }}>
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
