import { motion } from "framer-motion";
import {
  FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter,
  FiInstagram, FiYoutube, FiLinkedin, FiArrowRight
} from "react-icons/fi";
import logo from "../../assets/images/logo.png";

const FOOTER_LINKS = {
  Shop: ["On-Grid Solar Kits", "Off-Grid Solar Kits", "Hybrid Solar Kits", "Commercial Solar Kits", "Solar BOS Kits", "Custom Combo Kits"],
  Support: ["How to Order", "Installation Guide", "Subsidy Guide", "EMI Options", "Solar Calculator", "Product Warranty"],
  Company: ["About SolarKits", "Franchise Partner", "Blog", "Careers", "Press", "Contact Us"],
  Policies: ["Privacy Policy", "Terms of Use", "Return Policy", "Refund Policy", "Shipping Policy", "Cookie Policy"],
};

const SOCIAL = [
  { icon: <FiFacebook />, href: "#", label: "Facebook" },
  { icon: <FiInstagram />, href: "#", label: "Instagram" },
  { icon: <FiTwitter />, href: "#", label: "Twitter" },
  { icon: <FiYoutube />, href: "#", label: "YouTube" },
  { icon: <FiLinkedin />, href: "#", label: "LinkedIn" },
];

const PAYMENT_ICONS = ["💳 Visa", "💳 Mastercard", "🏦 Net Banking", "📱 UPI", "📲 GPay", "🏷️ EMI"];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      {/* CTA Strip */}
      <div className="bg-primary-500 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-bold text-xl text-white mb-1">
              Ready to Go Solar? Get a Free Quote!
            </h3>
            <p className="text-white/75 text-sm">Our solar experts will help you design the perfect system</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter your pincode"
              className="px-4 py-3 bg-white/15 border border-white/30 rounded-xl text-white placeholder-white/60 text-sm focus:outline-none focus:border-white/60 min-w-[180px]"
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-3 orange-gradient text-white font-bold rounded-xl text-sm shadow-md"
            >
              Get Quote <FiArrowRight />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            {/* Logo */}
            <div className="bg-white inline-flex px-3 py-2 rounded-xl mb-5">
              <img src={logo} alt="SolarKits" className="h-8 w-auto" />
            </div>

            <p className="text-white/65 text-sm leading-relaxed mb-5 max-w-xs">
              SolarKits is India's trusted solar marketplace — connecting homeowners,
              farmers & businesses with quality solar products and expert support.
            </p>

            {/* Contact */}
            <div className="space-y-2.5 mb-6">
              <a href="tel:1800XXXXXXX" className="flex items-center gap-2.5 text-white/70 hover:text-white text-sm transition-colors">
                <FiPhone className="text-accent flex-shrink-0" />
                1800-XXX-XXXX (Mon–Sat, 9AM–6PM)
              </a>
              <a href="mailto:support@solarkits.in" className="flex items-center gap-2.5 text-white/70 hover:text-white text-sm transition-colors">
                <FiMail className="text-accent flex-shrink-0" />
                support@solarkits.in
              </a>
              <div className="flex items-start gap-2.5 text-white/70 text-sm">
                <FiMapPin className="text-accent flex-shrink-0 mt-0.5" />
                <span>SolarKits Pvt. Ltd., Mumbai, Maharashtra, India</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-accent/90 flex items-center justify-center text-white/70 hover:text-white transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-heading font-bold text-white text-sm mb-4 uppercase tracking-wider">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/55 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 mt-12 pt-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h4 className="font-heading font-bold text-white text-base mb-1">
                📬 Subscribe to Solar Tips & Offers
              </h4>
              <p className="text-white/50 text-xs">Get weekly solar tips, subsidy updates & exclusive deals</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 md:w-64 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40 transition-all"
              />
              <button className="px-5 py-3 bg-accent hover:bg-accent-500 text-white font-bold rounded-xl text-sm transition-all flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/45 text-xs text-center md:text-left">
            © {new Date().getFullYear()} SolarKits™ Pvt. Ltd. All rights reserved. | CIN: UXXXXXXMHXXXXPTCXXXXXX
          </p>

          {/* Payment methods */}
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_ICONS.map((p) => (
              <span key={p} className="text-[10px] text-white/45 bg-white/8 px-2 py-1 rounded-md">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}