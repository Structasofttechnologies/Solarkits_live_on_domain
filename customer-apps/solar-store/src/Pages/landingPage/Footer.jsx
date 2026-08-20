import { motion } from "framer-motion";
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

const HELP_LINKS = ["About Us", "Contact Us", "Installation Guide", "Product Warranty"];
const POLICY_LINKS = ["Privacy", "Terms", "Returns", "Shipping"];

const SOCIALS = [
  { Icon: FiFacebook, href: "#", label: "Facebook" },
  { Icon: FiInstagram, href: "#", label: "Instagram" },
  { Icon: FiTwitter, href: "#", label: "Twitter" },
  { Icon: FiYoutube, href: "#", label: "YouTube" },
  { Icon: FiLinkedin, href: "#", label: "LinkedIn" },
];

const FooterLink = ({ children }) => (
  <a
    href="#"
    className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
  >
    <span className="h-px w-0 bg-accent transition-all duration-300 group-hover:w-3" />
    {children}
  </a>
);

export default function Footer() {
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
                Free solar consultation
              </span>
              <h3 className="font-heading text-2xl font-bold md:text-3xl">
                Ready to switch to solar?
              </h3>
              <p className="mt-2 text-sm text-white/75">
                Share your pincode and our expert will suggest the right solar kit.
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
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-accent-500"
              >
                Get free quote <FiArrowRight />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main footer: only essential sections */}
        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-16">
          <div className="lg:col-span-5">
            <div className="mb-5 inline-flex rounded-xl bg-white px-3 py-2">
              <img src={logo} alt="SolarKits" className="h-8 w-auto" />
            </div>
            <p className="max-w-md text-sm leading-7 text-white/60">
              Quality solar kits, honest guidance and reliable support for homes,
              farms and businesses across India.
            </p>

            <div className="mt-6 grid gap-3 text-sm text-white/65 sm:grid-cols-2 lg:grid-cols-1">
              <a href="tel:1800XXXXXXX" className="flex items-center gap-3 hover:text-white">
                <FiPhone className="text-accent" /> 1800-XXX-XXXX
              </a>
              <a href="mailto:support@solarkits.in" className="flex items-center gap-3 hover:text-white">
                <FiMail className="text-accent" /> support@solarkits.in
              </a>
              <p className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                <FiMapPin className="mt-1 shrink-0 text-accent" /> Mumbai, Maharashtra, India
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white">Solar kits</h4>
            <nav className="flex flex-col items-start gap-3.5">
              {SHOP_LINKS.map((link) => <FooterLink key={link}>{link}</FooterLink>)}
            </nav>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-white">Help & company</h4>
            <nav className="flex flex-col items-start gap-3.5">
              {HELP_LINKS.map((link) => <FooterLink key={link}>{link}</FooterLink>)}
            </nav>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
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
              <button aria-label="Subscribe" className="m-1 grid w-11 place-items-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-500">
                <FiArrowRight />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/55 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent hover:text-white">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slim legal/payment bar */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-xs text-white/45 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} SolarKits™ Pvt. Ltd.</span>
            <nav className="flex flex-wrap gap-x-4 gap-y-2">
              {POLICY_LINKS.map((link) => <a key={link} href="#" className="hover:text-white">{link}</a>)}
            </nav>
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