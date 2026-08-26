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
    count: "45+ Kits",
    label: "On-Grid",
    href: "#products",
  },
  {
    id: 2,
    name: "Off-Grid Solar Kits",
    desc: "Battery-backed complete solar kits for 24x7 independent power without grid reliance.",
    icon: FiZap,
    count: "30+ Kits",
    label: "Off-Grid",
    href: "#products",
  },
  {
    id: 3,
    name: "Hybrid Solar Kits",
    desc: "Best of both: Grid connectivity with battery backup for uninterrupted power & maximum savings.",
    icon: FiPackage,
    count: "25+ Kits",
    label: "Hybrid",
    href: "#products",
  },
  {
    id: 4,
    name: "Solar Custom Kits",
    desc: "Pre-wired AC/DC distribution boxes, lightning arrestors, earthing kits and custom combos.",
    icon: FiGrid,
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
  let Icon = category.icon || FiSun;
  if (category.icon_type === "zap") Icon = FiZap;
  else if (category.icon_type === "package") Icon = FiPackage;
  else if (category.icon_type === "grid") Icon = FiGrid;

  return (
    <motion.a
      href={category.href || "#products"}
      variants={cardVariants}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="group relative isolate flex min-h-[340px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-primary-200 hover:shadow-card md:p-7"
    >
      {/* Subtle decorative glow on hover */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary-50 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full w-full flex-col">
        {/* Card top */}
        <div className="flex items-start justify-between">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-primary-100 bg-primary-50 text-2xl text-primary-500 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white">
            <Icon />
          </div>

          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 transition-colors group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-600">
            Category {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Card content */}
        <div className="mt-7">
          <h3 className="font-heading text-xl font-extrabold leading-tight text-navy transition-colors group-hover:text-primary-600 md:text-2xl">
            {category.name}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            {category.desc}
          </p>
        </div>

        {/* Card bottom */}
        <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-6">
          <div>
            <span className="block font-heading text-2xl font-extrabold text-navy">
              {category.count}
            </span>

            <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              {category.label}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 py-2 pl-4 pr-2 text-xs font-bold text-primary-600 transition-all duration-300 group-hover:border-primary-500 group-hover:bg-primary-500 group-hover:text-white">
            Explore

            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-primary-600 shadow-sm transition-all duration-300 group-hover:bg-white/20 group-hover:text-white group-hover:rotate-45">
              <FiArrowUpRight className="text-sm" />
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

export default function CategorySection({ categoriesConfig }) {
  if (categoriesConfig && categoriesConfig.enabled === false) return null;

  const badgeText = categoriesConfig?.badge_text || "Browse Solar Kit Categories";
  const heading = categoriesConfig?.heading || "Find the Right Solar";
  const highlightHeading = categoriesConfig?.highlight_heading || "Kit Solution";
  const subtitle = categoriesConfig?.subtitle || "Explore our certified range of complete solar kits designed for homes, businesses, farms and commercial projects.";
  const items = categoriesConfig?.items && categoriesConfig.items.length > 0 ? categoriesConfig.items : CATEGORIES;
  const note1 = categoriesConfig?.quality_note_1 || "All products are quality verified";
  const note2 = categoriesConfig?.quality_note_2 || "Pan-India delivery and installation support";

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
              {badgeText}
            </span>

            <h2 className="max-w-2xl font-heading text-3xl font-extrabold leading-tight text-navy md:text-4xl lg:text-5xl">
              {heading}{" "}
              <span className="text-primary-500">{highlightHeading}</span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-gray-500 md:text-base">
            {subtitle}
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
          {items.map((category, index) => (
            <CategoryCard
              key={category.id || index}
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
            {note1}
          </span>

          <span className="hidden text-gray-300 sm:block">•</span>

          <span className="text-sm font-medium text-gray-500">
            {note2}
          </span>
        </motion.div>
      </div>
    </section>
  );
}