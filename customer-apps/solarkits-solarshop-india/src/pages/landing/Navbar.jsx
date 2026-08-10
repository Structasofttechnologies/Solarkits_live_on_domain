import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import logo from "../../assets/images/logo.png";

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Products", href: "#products" },
  { label: "Why Solar Kits", href: "#why-choose" },
  { label: "How It Works", href: "#how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 1000,
          transition: "all 0.3s ease",
          background: scrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(16px)",
          boxShadow: scrolled ? "0 4px 30px rgba(15, 23, 42, 0.08)" : "0 2px 20px rgba(15, 23, 42, 0.04)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        <div style={{
          maxWidth: "1280px", margin: "0 auto", padding: "0 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "76px",
        }}>
          {/* Brand Logo with crisp white/light backing container */}
          <motion.div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            whileHover={{ scale: 1.02 }}
          >
            <div style={{
              background: "#ffffff",
              padding: "6px 14px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: "1px solid rgba(226,232,240,0.8)",
              display: "flex",
              alignItems: "center"
            }}>
              <img src={logo} alt="SolarKits" style={{ height: "36px", objectFit: "contain" }} />
            </div>
          </motion.div>

          {/* Desktop Nav Links */}
          <div style={{ display: "flex", gap: "36px", alignItems: "center" }} className="landing-hide-mobile">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#334155",
                  fontSize: "0.95rem", fontWeight: 600,
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  padding: "6px 2px",
                  position: "relative",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#1e40af"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <motion.button
              onClick={() => navigate("/auth/login")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "10px 22px",
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#1e293b",
                borderRadius: "10px",
                fontSize: "0.9rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
            >
              Sign In
            </motion.button>
            <motion.button
              onClick={() => navigate("/auth/signup")}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 25px rgba(30, 64, 175, 0.25)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                color: "#ffffff", borderRadius: "10px",
                fontSize: "0.9rem", fontWeight: 700,
                cursor: "pointer", border: "none",
                boxShadow: "0 4px 14px rgba(30, 64, 175, 0.2)",
                fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              Get Started <FiArrowRight style={{ fontSize: "0.95rem" }} />
            </motion.button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="landing-show-mobile"
              style={{
                background: "#f1f5f9", border: "1px solid #cbd5e1",
                color: "#0f172a", borderRadius: "8px",
                fontSize: "1.3rem", cursor: "pointer", padding: "8px",
                display: "none", alignItems: "center", justifyContent: "center"
              }}
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", top: "76px", left: 0, right: 0,
              zIndex: 999, background: "#ffffff",
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              padding: "20px 24px 28px",
              borderBottom: "2px solid #1e40af",
            }}
          >
            {NAV_LINKS.map((link, i) => (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleNavClick(link.href)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "12px 0", background: "none", border: "none",
                  borderBottom: "1px solid #f1f5f9",
                  color: "#1e293b", fontSize: "1rem",
                  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {link.label}
              </motion.button>
            ))}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => { navigate("/auth/login"); setMenuOpen(false); }}
                style={{ flex: 1, padding: "12px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Sign In
              </button>
              <button onClick={() => { navigate("/auth/signup"); setMenuOpen(false); }}
                style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#ffffff", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "inherit" }}>
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
