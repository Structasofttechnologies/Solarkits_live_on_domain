import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: 10000, suffix: "+", label: "Happy Customers", icon: "😊", color: "text-accent" },
  { value: 50, suffix: " MW+", label: "Solar Capacity Installed", icon: "☀️", color: "text-sky-solar" },
  { value: 25, suffix: " Yrs", label: "Performance Warranty", icon: "🛡️", color: "text-green-400" },
  { value: 4.8, suffix: "★", label: "Average Rating", icon: "⭐", color: "text-yellow-300", isDecimal: true },
];

function CountUp({ end, suffix, isDecimal = false }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, end, isDecimal]);

  return (
    <span ref={ref}>
      {isDecimal ? count.toFixed(1) : count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 solar-gradient" />
      {/* Decorative */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-white/15 text-white/90 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3 border border-white/20">
            Our Impact
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
            Powering India with Solar Energy
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="text-center"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className={`font-heading text-4xl md:text-5xl font-extrabold ${stat.color} mb-2`}>
                <CountUp end={stat.value} suffix={stat.suffix} isDecimal={stat.isDecimal} />
              </div>
              <p className="text-white/70 text-sm font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
