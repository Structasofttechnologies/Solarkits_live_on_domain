import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiStar } from "react-icons/fi";

const TESTIMONIALS = [
  { name: "Rajesh Patel", company: "Homeowner & Solar Customer", city: "Ahmedabad, Gujarat", initials: "RP", color: "#1a3b8b", bg: "#eff6ff", rating: 5, text: "SolarKits has transformed how I buy solar equipment online. The combo kits are BIS certified, and the district-based pricing is a game-changer. Delivery was right on time and checkout was seamless." },
  { name: "Sunita Verma", company: "Solar Buyer", city: "Jaipur, Rajasthan", initials: "SV", color: "#0d9488", bg: "#f0fdfa", rating: 5, text: "I ordered a 5kW hybrid solar kit from SolarKits. Saved 18% compared to local suppliers, and the live inventory feature helped me track availability and delivery perfectly." },
  { name: "Arjun Menon", company: "Residential Buyer", city: "Kochi, Kerala", initials: "AM", color: "#15803d", bg: "#f0fdf4", rating: 5, text: "The solar combo kit builder is incredibly easy to use. I configured my residential solar setup easily, and the support team guided us through subsidy options." },
  { name: "Priya Sharma", company: "Solar Contractor", city: "Pune, Maharashtra", initials: "PS", color: "#7c3aed", bg: "#f5f3ff", rating: 5, text: "Finally a solar e-commerce platform that actually understands customer needs! The order tracking, GST invoicing, and secure payment options make purchasing solar products so much faster than traditional channels." },
  { name: "Mohammed Iqbal", company: "Solar Installation Owner", city: "Hyderabad, Telangana", initials: "MI", color: "#d97706", bg: "#fffbeb", rating: 5, text: "Purchased Tier-1 solar panels and accessories for my site. Excellent product quality, competitive pricing, and the support team was super responsive on WhatsApp." },
  { name: "Deepa Nair", company: "Solar Shop Customer", city: "Chennai, Tamil Nadu", initials: "DN", color: "#dc2626", bg: "#fff1f2", rating: 5, text: "The location-based inventory system is brilliant! I could check stock for my specific district before placing the order. Accurate delivery timelines and great service!" },
];

export default function TestimonialsSection() {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const visibleItems = Array.from({ length: 3 }, (_, i) =>
    TESTIMONIALS[(currentIndex + i) % TESTIMONIALS.length]
  );

  return (
    <section
      ref={sectionRef}
      style={{ background: "#ffffff", padding: "96px 28px", position: "relative", overflow: "hidden" }}
    >
      {/* Top decorative wave */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "6px",
        background: "linear-gradient(90deg, #1a3b8b, #3b82f6, #f8c21a, #0d9488, #1a3b8b)",
      }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 30 }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: "64px" }}
        >
          <div style={{ display: "inline-block", background: "#fce7f3", border: "1px solid #fbcfe8", borderRadius: "50px", padding: "5px 14px", marginBottom: "16px" }}>
            <span style={{ color: "#be185d", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em" }}>CUSTOMER STORIES</span>
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, color: "#0f172a",
            fontFamily: "'Outfit', sans-serif", marginBottom: "16px", lineHeight: 1.2,
          }}>
            Trusted by Customers{" "}
            <span style={{ background: "linear-gradient(135deg, #1a3b8b, #3b82f6)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              Across India
            </span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", maxWidth: "500px", margin: "0 auto", lineHeight: 1.7 }}>
            Real feedback from customers and buyers who purchase solar products with SolarKits.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            <AnimatePresence mode="sync">
              {visibleItems.map((t, i) => (
                <motion.div
                  key={`${t.name}-${currentIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  style={{
                    background: "#fff", borderRadius: "20px", padding: "28px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                    border: "1.5px solid #f1f5f9",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 48px ${t.color}18`; e.currentTarget.style.borderColor = `${t.color}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
                >
                  {/* Stars */}
                  <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <FiStar key={si} style={{ color: "#f8c21a", fill: "#f8c21a", fontSize: "0.9rem" }} />
                    ))}
                  </div>
                  {/* Quote */}
                  <p style={{ color: "#374151", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "20px", fontStyle: "italic" }}>
                    "{t.text}"
                  </p>
                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      background: t.bg, border: `2px solid ${t.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: t.color, fontSize: "0.85rem", fontWeight: 700, flexShrink: 0,
                    }}>
                      {t.initials}
                    </div>
                    <div>
                      <div style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: 700 }}>{t.name}</div>
                      <div style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{t.company}</div>
                      <div style={{ color: t.color, fontSize: "0.75rem", fontWeight: 600, marginTop: "2px" }}>📍 {t.city}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "#f8faff", border: "1.5px solid #e2e8f0",
                color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "1.1rem", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.color = "#1a3b8b"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
            >
              <FiChevronLeft />
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: i === currentIndex ? "24px" : "8px", height: "8px",
                    borderRadius: "50px",
                    background: i === currentIndex ? "#1a3b8b" : "#cbd5e1",
                    border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "#f8faff", border: "1.5px solid #e2e8f0",
                color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "1.1rem", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.color = "#1a3b8b"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8faff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; }}
            >
              <FiChevronRight />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
