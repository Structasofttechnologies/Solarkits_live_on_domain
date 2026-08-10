import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from "react-icons/fi";

// Local authentic real-life solar project photographs (bundled locally via Vite - zero black screen & instant loading)
import solarImg1 from "../../assets/images/solar_project_1.jpg";
import solarImg2 from "../../assets/images/solar_project_2.jpg";
import solarImg3 from "../../assets/images/solar_project_3.jpg";
import solarImg4 from "../../assets/images/solar_project_4.jpg";
import solarImg5 from "../../assets/images/solar_project_5.jpg";

const SOLAR_IMAGES = [
  {
    id: 1,
    url: solarImg1,
    alt: "Real Commercial Solar Panels Installation",
  },
  {
    id: 2,
    url: solarImg2,
    alt: "Real Industrial Rooftop Solar Array",
  },
  {
    id: 3,
    url: solarImg3,
    alt: "Real Ground Mounted Solar Power Plant",
  },
  {
    id: 4,
    url: solarImg4,
    alt: "Real Agricultural Solar Panel Field",
  },
  {
    id: 5,
    url: solarImg5,
    alt: "Real Utility Solar Infrastructure Project",
  },
];

const AUTOPLAY_DURATION = 5000; // 5 seconds per slide

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const timerRef = useRef(null);

  // Preload all local images on component mount for zero latency
  useEffect(() => {
    [solarImg1, solarImg2, solarImg3, solarImg4, solarImg5].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SOLAR_IMAGES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SOLAR_IMAGES.length) % SOLAR_IMAGES.length);
  };

  const handleSelectSlide = (idx) => {
    setCurrentIndex(idx);
  };

  // Autoplay Effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, AUTOPLAY_DURATION);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPlaying]);

  // Swipe Gesture Handling
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  return (
    <section
      id="hero"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0f172a",
      }}
    >
      {/* Background Image Base Layer (Guarantees no black screen) */}
      <img
        src={SOLAR_IMAGES[currentIndex].url}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.9)",
        }}
      />

      {/* Cross-Fade Motion Layer */}
      <div style={{ position: "absolute", inset: 0 }}>
        <AnimatePresence initial={false}>
          <motion.img
            key={SOLAR_IMAGES[currentIndex].id}
            src={SOLAR_IMAGES[currentIndex].url}
            alt={SOLAR_IMAGES[currentIndex].alt}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </AnimatePresence>
      </div>

      {/* Subtle Vignette & Gradient Depth Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 40%, rgba(15,23,42,0.3) 100%), linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, transparent 25%, transparent 75%, rgba(15,23,42,0.5) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Floating Glassmorphic Left Arrow Button */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        style={{
          position: "absolute",
          left: "24px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "50%",
          width: "52px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
          e.currentTarget.style.scale = "1.1";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(15, 23, 42, 0.45)";
          e.currentTarget.style.scale = "1";
        }}
      >
        <FiChevronLeft size={28} />
      </button>

      {/* Floating Glassmorphic Right Arrow Button */}
      <button
        onClick={handleNext}
        aria-label="Next Slide"
        style={{
          position: "absolute",
          right: "24px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "50%",
          width: "52px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
          e.currentTarget.style.scale = "1.1";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(15, 23, 42, 0.45)";
          e.currentTarget.style.scale = "1";
        }}
      >
        <FiChevronRight size={28} />
      </button>

      {/* Bottom Floating Control Bar (Dots + Play/Pause) */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(15, 23, 42, 0.55)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "50px",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: "18px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause Auto Play" : "Start Auto Play"}
          style={{
            background: "transparent",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} />}
        </button>

        {/* Slide Indicator Dots */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {SOLAR_IMAGES.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => handleSelectSlide(idx)}
              style={{
                width: idx === currentIndex ? "32px" : "12px",
                height: "12px",
                borderRadius: "6px",
                background: idx === currentIndex ? "#ffffff" : "rgba(255, 255, 255, 0.35)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Top Auto-Slide Progress Bar */}
      {isPlaying && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background: "rgba(255, 255, 255, 0.15)",
            zIndex: 20,
          }}
        >
          <motion.div
            key={currentIndex}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTOPLAY_DURATION / 1000, ease: "linear" }}
            style={{
              height: "100%",
              background: "#3b82f6",
              boxShadow: "0 0 10px #3b82f6",
            }}
          />
        </div>
      )}
    </section>
  );
}
