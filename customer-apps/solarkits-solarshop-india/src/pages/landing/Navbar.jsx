import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiArrowRight, FiChevronRight } from "react-icons/fi";
import logo from "../../assets/images/logo.png";

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Products", href: "#products" },
  { label: "Why Solar Kits", href: "#why-choose" },
  {
    label: "Become Franchise Partner",
    href: "https://solarkits-reseller-portal.onrender.com",
  },
  { label: "Shop", href: "/solar-shop" },
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

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const handleNavClick = (href) => {
    setMenuOpen(false);

    // Same-page section links such as #hero and #products.
    if (href.startsWith("#")) {
      const section = document.querySelector(href);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    // Links belonging to another website.
    if (href.startsWith("http://") || href.startsWith("https://")) {
      window.location.assign(href);
      return;
    }

    // Internal React Router pages such as /solar-shop.
    navigate(href);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "all 0.3s ease",
          background: scrolled
            ? "rgba(255, 255, 255, 0.96)"
            : "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: scrolled
            ? "0 4px 30px rgba(15, 23, 42, 0.08)"
            : "0 2px 20px rgba(15, 23, 42, 0.04)",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "72px",
          }}
        >
          {/* Brand Logo with crisp white/light backing container */}
          <motion.div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              style={{
                background: "#ffffff",
                padding: "6px 12px",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                border: "1px solid rgba(226,232,240,0.8)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={logo}
                alt="SolarKits"
                style={{
                  height: "32px",
                  objectFit: "contain",
                  maxWidth: "130px",
                }}
              />
            </div>
          </motion.div>

          {/* Desktop Nav Links */}
          <div
            style={{ display: "flex", gap: "32px", alignItems: "center" }}
            className="landing-hide-mobile"
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#334155",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  padding: "6px 2px",
                  position: "relative",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1e40af")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#334155")}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Action Buttons & Mobile Trigger */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* Desktop Action Buttons */}
            <div
              className="landing-hide-mobile"
              style={{ display: "flex", gap: "12px", alignItems: "center" }}
            >
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
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => navigate("/auth/signup")}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 8px 25px rgba(30, 64, 175, 0.25)",
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "10px 24px",
                  background:
                    "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                  color: "#ffffff",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(30, 64, 175, 0.2)",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Get Started <FiArrowRight style={{ fontSize: "0.95rem" }} />
              </motion.button>
            </div>

            {/* Mobile menu trigger */}
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              className="landing-show-mobile"
              whileTap={{ scale: 0.92 }}
              aria-label="Toggle Navigation Menu"
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                borderRadius: "10px",
                width: "42px",
                height: "42px",
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {menuOpen ? (
                <FiX style={{ fontSize: "1.4rem", color: "#1e40af" }} />
              ) : (
                <FiMenu style={{ fontSize: "1.4rem", color: "#0f172a" }} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer & Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(4px)",
                zIndex: 998,
              }}
            />

            {/* Mobile Menu Dropdown Card */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "fixed",
                top: "78px",
                left: "12px",
                right: "12px",
                maxHeight: "calc(100vh - 96px)",
                overflowY: "auto",
                zIndex: 999,
                background: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)",
                padding: "20px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {NAV_LINKS.map((link, i) => (
                  <motion.button
                    key={link.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleNavClick(link.href)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "14px 16px",
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      color: "#1e293b",
                      fontSize: "1rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>{link.label}</span>
                    <FiChevronRight
                      style={{ color: "#94a3b8", fontSize: "1.1rem" }}
                    />
                  </motion.button>
                ))}
              </div>

              <div
                style={{
                  height: "1px",
                  background: "#e2e8f0",
                  margin: "20px 0 16px",
                }}
              />

              {/* Action Buttons inside Mobile View */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => {
                    navigate("/auth/login");
                    setMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    height: "48px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    borderRadius: "12px",
                    fontSize: "0.98rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    navigate("/auth/signup");
                    setMenuOpen(false);
                  }}
                  style={{
                    width: "100%",
                    height: "48px",
                    background:
                      "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                    color: "#ffffff",
                    borderRadius: "12px",
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 6px 20px rgba(30, 64, 175, 0.25)",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  Get Started <FiArrowRight style={{ fontSize: "1rem" }} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
