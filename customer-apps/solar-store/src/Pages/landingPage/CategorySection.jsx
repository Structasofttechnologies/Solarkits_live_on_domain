import { motion } from "framer-motion";
import {
  FiArrowUpRight,
  FiBox,
  FiGrid,
  FiPackage,
  FiSun,
  FiZap,
} from "react-icons/fi";

const CATEGORIES = [
  {
    id: 1,
    name: "On-Grid Solar Kits",
    desc: "Grid-tied rooftop solar kits from 1kW to 10kW with net-metering & PM Surya Ghar subsidy.",
    icon: FiSun,
    color: "from-blue-500 via-blue-600 to-indigo-700",
    glow: "bg-cyan-300",
    shadow: "rgba(37, 99, 235, 0.25)",
    count: "45+ Kits",
    label: "On-Grid",
    href: "#products",
  },
  {
    id: 2,
    name: "Off-Grid Solar Kits",
    desc: "Battery-backed complete solar kits for 24x7 independent power without grid reliance.",
    icon: FiZap,
    color: "from-cyan-500 via-sky-600 to-blue-700",
    glow: "bg-sky-300",
    shadow: "rgba(14, 165, 233, 0.25)",
    count: "30+ Kits",
    label: "Off-Grid",
    href: "#products",
  },
  {
    id: 3,
    name: "Hybrid Solar Kits",
    desc: "Best of both: Grid connectivity with battery backup for uninterrupted power & maximum savings.",
    icon: FiPackage,
    color: "from-orange-400 via-orange-500 to-red-600",
    glow: "bg-yellow-300",
    shadow: "rgba(249, 115, 22, 0.25)",
    count: "25+ Kits",
    label: "Hybrid",
    href: "#products",
  },
  {
    id: 4,
    name: "Solar Custom Kits",
    desc: "Pre-wired AC/DC distribution boxes, lightning arrestors, earthing kits and custom combos.",
    icon: FiGrid,
    color: "from-slate-700 via-blue-900 to-slate-950",
    glow: "bg-blue-300",
    shadow: "rgba(15, 23, 42, 0.28)",
    count: "50+ Kits",
    label: "Custom Kits",
    href: "#products",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

function CategoryCard({ category, index }) {
  const Icon = category.icon;

  return (
    <motion.a
      href={category.href}
      variants={cardVariants}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.98 }}
      className={`
        group relative isolate flex min-h-[330px] overflow-hidden rounded-3xl
        bg-gradient-to-br p-6 text-white md:p-7
        ${category.color}
      `}
      style={{
        boxShadow: `0 18px 45px ${category.shadow}`,
      }}
    >
      {/* Decorative glow */}
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-40 ${category.glow}`}
      />

      {/* Decorative rings */}
      <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full border border-white/10" />

      {/* Bottom texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10 flex w-full flex-col">
        {/* Card top */}
        <div className="flex items-start justify-between">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-white/15 text-3xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-white/25">
            <Icon />
          </div>

          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-md">
            Category {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Card content */}
        <div className="mt-8">
          <h3 className="font-heading text-2xl font-extrabold leading-tight md:text-[26px]">
            {category.name}
          </h3>

          <p className="mt-3 max-w-[280px] text-sm leading-6 text-white/75">
            {category.desc}
          </p>
        </div>

        {/* Card bottom */}
        <div className="mt-auto flex items-end justify-between pt-8">
          <div>
            <span className="block text-3xl font-extrabold leading-none">
              {category.count}
            </span>

            <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-white/65">
              {category.label}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 py-2 pl-4 pr-2 text-sm font-bold backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-gray-900">
            Explore

            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-gray-900 transition-transform duration-300 group-hover:rotate-45">
              <FiArrowUpRight className="text-base" />
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

export default function CategorySection() {
  return (
    <section
      id="categories"
      className="relative overflow-hidden bg-white py-16 md:py-24"
    >
      {/* Section background */}
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-orange-50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-600">
              <FiBox />
              Browse Solar Kit Categories
            </span>

            <h2 className="max-w-2xl font-heading text-3xl font-extrabold leading-tight text-navy md:text-4xl lg:text-5xl">
              Find the Right Solar
              <span className="text-primary-500"> Kit Solution</span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-gray-500 md:text-base">
            Explore our certified range of complete solar kits designed for homes,
            businesses, farms and commercial projects.
          </p>
        </motion.div>

        {/* Category cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
        >
          {CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
            />
          ))}
        </motion.div>

        {/* Bottom information */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 text-center sm:flex-row"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            All products are quality verified
          </span>

          <span className="hidden text-gray-300 sm:block">•</span>

          <span className="text-sm font-medium text-gray-500">
            Pan-India delivery and installation support
          </span>
        </motion.div>
      </div>
    </section>
  );
}