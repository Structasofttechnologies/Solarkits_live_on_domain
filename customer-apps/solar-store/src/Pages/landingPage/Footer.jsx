import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiFacebook,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter,
  FiYoutube,
} from "react-icons/fi";
import logo from "../../assets/images/logo.png";

const SHOP_LINKS = [
  "On-Grid Solar Kits",
  "Off-Grid Solar Kits",
  "Hybrid Solar Kits",
  "Commercial Solar Kits",
];


export default function Footer({ footerConfig }) {
  const navigate = useNavigate();

  const boxBadge = footerConfig?.consultation_box?.badge || "Free solar consultation";
  const boxHeading = footerConfig?.consultation_box?.heading || "Ready to switch to solar?";
  const boxSubtitle = footerConfig?.consultation_box?.subtitle || "Share your pincode and our expert will suggest the right solar kit.";
  const boxBtn = footerConfig?.consultation_box?.button_text || "Get free quote";

  const description = footerConfig?.description || "Quality solar kits, honest guidance and reliable support for homes, farms and businesses across India.";
  const phone = footerConfig?.phone || "+91 77779 39842";
  const email = footerConfig?.email || "ravi.s@sunnovative.com";
  const address = footerConfig?.address || "1 Tirupati Ind area, 150 Feet Ring Rd, behind patidar auto consultant, near Umiya chowk, Rajkot, Gujarat 360004";

  const shopLinks = footerConfig?.shop_links && footerConfig.shop_links.length > 0 ? footerConfig.shop_links : SHOP_LINKS;
  const copyright = footerConfig?.copyright_text || `© ${new Date().getFullYear()} SolarKits™ Pvt. Ltd. All Rights Reserved.`;

  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute -right-28 top-24 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Compact quote card */}
        <div className="relative overflow-hidden rounded-3xl bg-primary-500 px-6 py-7 shadow-2xl shadow-black/15 md:px-9">
          <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full border-[36px] border-white/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                {boxBadge}
              </span>
              <h3 className="font-heading text-2xl font-bold md:text-3xl">
                {boxHeading}
              </h3>
              <p className="mt-2 text-sm text-white/75">
                {boxSubtitle}
              </p>
            </div>

            <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                aria-label="Pincode"
                placeholder="Enter 6-digit pincode"
                className="min-w-0 flex-1 rounded-xl border border-white/25 bg-white px-4 py-3.5 text-sm text-navy outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/20"
              />
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-accent-500 cursor-pointer"
              >
                {boxBtn} <FiArrowRight />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main footer: essential sections only */}
        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-16">
          <div className="lg:col-span-5">
            <div className="mb-5 inline-flex rounded-xl bg-white px-3 py-2">
              <img src={logo} alt="SolarKits" className="h-8 w-auto" />
            </div>
            <p className="max-w-md text-sm leading-7 text-white/60">
              {description}
            </p>

            <div className="mt-6 grid gap-3 text-sm text-white/65 sm:grid-cols-2 lg:grid-cols-1">
              <a href={`tel:${phone}`} className="flex items-center gap-3 hover:text-white transition-colors">
                <FiPhone className="text-accent" /> {phone}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-3 hover:text-white transition-colors">
                <FiMail className="text-accent" /> {email}
              </a>
              <p className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                <FiMapPin className="mt-1 shrink-0 text-accent" /> {address}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white">Solar kits</h4>
            <nav className="flex flex-col items-start gap-3.5">
              {shopLinks.map((link, idx) => {
                const label = typeof link === "string" ? link : link.label;
                return (
                  <button
                    key={label || idx}
                    type="button"
                    onClick={() => navigate("/shop")}
                    className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white cursor-pointer"
                  >
                    <span className="h-px w-0 bg-accent transition-all duration-300 group-hover:w-3" />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="md:col-span-2 lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Solar tips, once a week</h4>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Useful tips, subsidy updates and offers. No spam.
            </p>
            <form className="mt-5 flex overflow-hidden rounded-xl border border-white/15 bg-white/5 focus-within:border-accent/70">
              <input
                type="email"
                aria-label="Email address"
                placeholder="Email address"
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button aria-label="Subscribe" className="m-1 grid w-11 place-items-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-500 cursor-pointer">
                <FiArrowRight />
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Slim copyright & payment bar */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-xs text-white/45 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span>{copyright}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Payment methods">
            {['UPI', 'Visa', 'Mastercard', 'Net Banking', 'EMI'].map((method) => (
              <span key={method} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold tracking-wide text-white/55">{method}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}