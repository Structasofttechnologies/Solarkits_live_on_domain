import { useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

import {
  FiShoppingCart,
  FiHeart,
  FiStar,
  FiEye,
  FiTag,
} from "react-icons/fi";

// Product images
import imgPanelMono from "../../assets/images/product_panel_mono.jpg";
import imgInverter from "../../assets/images/product_inverter.jpg";
import imgKit from "../../assets/images/product_solar_kit.jpg";
import imgBattery from "../../assets/images/product_battery.jpg";
import imgBifacial from "../../assets/images/product_bifacial.jpg";
import imgChargeCtrl from "../../assets/images/product_charge_ctrl.jpg";

const PRODUCTS = [
  {
    id: 1,
    name: "Adani 550W Mono PERC Solar Panel",
    category: "Solar Panel",
    badge: "Bestseller",
    badgeColor: "bg-orange-500 text-white",
    rating: 4.8,
    reviews: 234,
    price: 18500,
    mrp: 22000,
    discount: 16,
    watt: "550W",
    brand: "Adani Solar",
    img: imgPanelMono,
  },
  {
    id: 2,
    name: "Solis 3kW On-Grid Hybrid Inverter",
    category: "Inverter",
    badge: "New Arrival",
    badgeColor: "bg-sky-500 text-white",
    rating: 4.6,
    reviews: 89,
    price: 32000,
    mrp: 38500,
    discount: 17,
    watt: "3kW",
    brand: "Solis",
    img: imgInverter,
  },
  {
    id: 3,
    name: "SolarKits 3kW Complete Home Kit",
    category: "Solar Kit",
    badge: "🔥 Hot Deal",
    badgeColor: "bg-red-500 text-white",
    rating: 4.9,
    reviews: 156,
    price: 145000,
    mrp: 195000,
    discount: 26,
    watt: "3kW",
    brand: "SolarKits",
    img: imgKit,
  },
  {
    id: 4,
    name: "Exide 150Ah Tubular Solar Battery",
    category: "Battery",
    badge: "Subsidy Eligible",
    badgeColor: "bg-green-500 text-white",
    rating: 4.7,
    reviews: 312,
    price: 14200,
    mrp: 17500,
    discount: 19,
    watt: "150Ah",
    brand: "Exide",
    img: imgBattery,
  },
  {
    id: 5,
    name: "Waaree 440W Bifacial Solar Module",
    category: "Solar Panel",
    badge: "Premium",
    badgeColor: "bg-blue-600 text-white",
    rating: 4.8,
    reviews: 178,
    price: 16800,
    mrp: 20000,
    discount: 16,
    watt: "440W",
    brand: "Waaree",
    img: imgBifacial,
  },
  {
    id: 6,
    name: "EPEVER 40A MPPT Charge Controller",
    category: "Accessory",
    badge: "Value Pick",
    badgeColor: "bg-purple-500 text-white",
    rating: 4.5,
    reviews: 92,
    price: 4800,
    mrp: 6500,
    discount: 26,
    watt: "40A",
    brand: "EPEVER",
    img: imgChargeCtrl,
  },
];

function ProductCard({ product }) {
  const [wished, setWished] = useState(false);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      {/* Product image */}
      <div className="relative h-[300px] overflow-hidden bg-gradient-to-b from-gray-50 to-white sm:h-[330px]">
        <span
          className={`absolute left-4 top-4 z-20 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${product.badgeColor}`}
        >
          {product.badge}
        </span>

        <span className="absolute right-16 top-4 z-20 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500">
          {product.discount}% OFF
        </span>

        <button
          type="button"
          onClick={() => setWished((current) => !current)}
          aria-label={
            wished ? "Remove from wishlist" : "Add product to wishlist"
          }
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md transition-transform hover:scale-110"
        >
          <FiHeart
            className={`text-lg ${wished
                ? "fill-red-500 text-red-500"
                : "text-gray-500"
              }`}
          />
        </button>

        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-7 transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 flex items-end justify-center bg-black/0 pb-5 opacity-0 transition-all duration-300 group-hover:bg-black/5 group-hover:opacity-100">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary-600 shadow-lg transition hover:bg-primary-50"
          >
            <FiEye />
            Quick View
          </button>
        </div>
      </div>

      {/* Product information */}
      <div className="flex flex-1 flex-col p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-500">
          {product.brand} • {product.category}
        </p>

        <h3 className="mb-3 min-h-[56px] text-lg font-bold leading-snug text-gray-900">
          {product.name}
        </h3>

        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-600">
            {product.watt}
          </span>

          <div className="flex items-center gap-1.5">
            <FiStar className="fill-orange-400 text-orange-400" />

            <span className="text-sm font-bold text-gray-700">
              {product.rating}
            </span>

            <span className="text-xs text-gray-400">
              ({product.reviews})
            </span>
          </div>
        </div>

        <div className="mb-5 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold text-navy">
              ₹{product.price.toLocaleString("en-IN")}
            </span>

            <span className="text-sm text-gray-400 line-through">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
          </div>

          <p className="mt-1 text-xs font-medium text-green-600">
            You save ₹
            {(product.mrp - product.price).toLocaleString("en-IN")}
          </p>
        </div>

        <button
          type="button"
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-lg active:scale-[0.98]"
        >
          <FiShoppingCart className="text-lg" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export default function FeaturedProducts() {
  return (
    <section
      id="products"
      className="overflow-hidden bg-solarbg py-14 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <span className="mb-3 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-600">
              Most Popular
            </span>

            <h2 className="font-heading text-3xl font-bold text-navy md:text-4xl">
              Bestselling Products
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 md:text-base">
              Explore our most trusted solar products selected for performance,
              durability and excellent value.
            </p>
          </div>

          <a
            href="#all-products"
            className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-primary-500 transition-colors hover:text-primary-700"
          >
            View All Products
            <FiTag className="text-base" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6 }}
        >
          <Swiper
            modules={[Autoplay]}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={false}
            loop
            grabCursor
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 22,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 28,
              },
            }}
            className="!overflow-visible pb-8"
          >
            {PRODUCTS.map((product) => (
              <SwiperSlide key={product.id} className="h-auto">
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  );
}