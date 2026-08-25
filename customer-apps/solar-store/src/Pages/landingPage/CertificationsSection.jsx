import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import {
  FiArrowRight,
  FiCheckCircle,
  FiCpu,
  FiSun,
  FiZap,
} from "react-icons/fi";

const BRANDS = [
  {
    id: 1,
    name: "Adani Solar",
    type: "Solar Kit Partner",
    description: "Tier-1 high-efficiency Mono PERC solar modules",
    icon: <FiSun />,
    color: "from-orange-50 to-amber-100",
    iconColor: "bg-orange-500",
  },
  {
    id: 2,
    name: "Waaree",
    type: "Solar Kit Partner",
    description: "Reliable mono and bifacial solar kit modules",
    icon: <FiSun />,
    color: "from-blue-50 to-cyan-100",
    iconColor: "bg-blue-500",
  },
  {
    id: 3,
    name: "Tata Power Solar",
    type: "Solar Kit Partner",
    description: "Trusted residential and commercial kit panels",
    icon: <FiSun />,
    color: "from-sky-50 to-blue-100",
    iconColor: "bg-sky-500",
  },
  {
    id: 4,
    name: "Vikram Solar",
    type: "Solar Kit Partner",
    description: "Premium high-performance solar kit modules",
    icon: <FiSun />,
    color: "from-yellow-50 to-orange-100",
    iconColor: "bg-yellow-500",
  },
  {
    id: 5,
    name: "Luminous",
    type: "Solar Kit Partner",
    description: "Complete rooftop solar kit power solutions",
    icon: <FiZap />,
    color: "from-amber-50 to-yellow-100",
    iconColor: "bg-amber-500",
  },
  {
    id: 6,
    name: "Loom Solar",
    type: "Solar Kit Partner",
    description: "Advanced rooftop solar kit technology",
    icon: <FiSun />,
    color: "from-green-50 to-emerald-100",
    iconColor: "bg-green-500",
  },
  {
    id: 7,
    name: "RenewSys",
    type: "Solar Kit Partner",
    description: "Durable and efficient PV solar kit modules",
    icon: <FiSun />,
    color: "from-teal-50 to-cyan-100",
    iconColor: "bg-teal-500",
  },
  {
    id: 8,
    name: "Goldi Solar",
    type: "Solar Kit Partner",
    description: "Quality-certified Indian solar kit modules",
    icon: <FiSun />,
    color: "from-yellow-50 to-amber-100",
    iconColor: "bg-yellow-600",
  },
  {
    id: 9,
    name: "Solis",
    type: "Solar Kit Partner",
    description: "Smart on-grid and hybrid solar kit power systems",
    icon: <FiCpu />,
    color: "from-sky-50 to-indigo-100",
    iconColor: "bg-indigo-500",
  },
  {
    id: 10,
    name: "Growatt",
    type: "Solar Kit Partner",
    description: "Intelligent residential solar kit power units",
    icon: <FiCpu />,
    color: "from-green-50 to-lime-100",
    iconColor: "bg-lime-600",
  },
  {
    id: 11,
    name: "Microtek",
    type: "Solar Kit Partner",
    description: "Reliable solar kit power conditioning units",
    icon: <FiZap />,
    color: "from-red-50 to-orange-100",
    iconColor: "bg-red-500",
  },
  {
    id: 12,
    name: "UTL Solar",
    type: "Solar Kit Partner",
    description: "Complete off-grid and hybrid solar kit packages",
    icon: <FiCpu />,
    color: "from-purple-50 to-violet-100",
    iconColor: "bg-purple-500",
  },
  {
    id: 13,
    name: "Sungrow",
    type: "Solar Kit Partner",
    description: "Premium string and commercial solar kit systems",
    icon: <FiCpu />,
    color: "from-blue-50 to-indigo-100",
    iconColor: "bg-blue-600",
  },
  {
    id: 14,
    name: "GoodWe",
    type: "Solar Kit Partner",
    description: "Efficient on-grid and energy storage solar kits",
    icon: <FiZap />,
    color: "from-red-50 to-rose-100",
    iconColor: "bg-rose-500",
  },
  {
    id: 15,
    name: "Huawei Solar",
    type: "Solar Kit Partner",
    description: "Smart commercial and industrial solar kit solutions",
    icon: <FiCpu />,
    color: "from-pink-50 to-red-100",
    iconColor: "bg-pink-500",
  },
  {
    id: 16,
    name: "Delta",
    type: "Solar Kit Partner",
    description: "Industrial-grade 3-phase solar kit systems",
    icon: <FiZap />,
    color: "from-cyan-50 to-blue-100",
    iconColor: "bg-cyan-600",
  },
];

function BrandCard({ brand }) {
  return (
    <motion.article
      whileHover={{ y: -8 }}
      transition={{ duration: 0.25 }}
      className={`
        group flex h-full min-h-[260px] flex-col overflow-hidden rounded-3xl
        border border-white bg-gradient-to-br p-6 shadow-md
        transition-shadow duration-300 hover:shadow-2xl
        ${brand.color}
      `}
    >
      <div className="mb-8 flex items-start justify-between">
        <div
          className={`
            grid h-16 w-16 place-items-center rounded-2xl text-3xl
            text-white shadow-lg transition-transform duration-300
            group-hover:rotate-6 group-hover:scale-110
            ${brand.iconColor}
          `}
        >
          {brand.icon}
        </div>

        <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold text-green-600 shadow-sm backdrop-blur-sm">
          <FiCheckCircle />
          Authorized
        </span>
      </div>

      <div className="mt-auto">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-600">
          {brand.type}
        </p>

        <h3 className="mb-2 text-2xl font-extrabold text-navy">
          {brand.name}
        </h3>

        <p className="min-h-[42px] text-sm leading-relaxed text-gray-600">
          {brand.description}
        </p>

        <button
          type="button"
          className="mt-5 flex items-center gap-2 text-sm font-bold text-primary-600 transition-all group-hover:gap-3"
        >
          View Products
          <FiArrowRight />
        </button>
      </div>
    </motion.article>
  );
}

export default function CertificationsSection() {
  return (
    <section id="brands" className="overflow-hidden bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="mb-3 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-600">
            Our Brand Partners
          </span>

          <h2 className="font-heading text-3xl font-bold text-navy md:text-4xl">
            Top Solar Kit Brand Partners
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
            Explore certified Tier-1 component manufacturers integrated into SolarKits complete solar solutions, selected for quality, efficiency and long-term performance.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6 }}
        >
          <Swiper
            modules={[Autoplay]}
            loop
            grabCursor
            speed={900}
            spaceBetween={24}
            slidesPerView={1.15}
            autoplay={{
              delay: 2200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              480: {
                slidesPerView: 1.5,
                spaceBetween: 18,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              900: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1200: {
                slidesPerView: 4,
                spaceBetween: 26,
              },
            }}
            className="!overflow-visible pb-10"
          >
            {BRANDS.map((brand) => (
              <SwiperSlide key={brand.id} className="h-auto">
                <BrandCard brand={brand} />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>

        <div className="mt-4 text-center">
          <a
            href="#all-brands"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-lg"
          >
            Explore All Brands
            <FiArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
}