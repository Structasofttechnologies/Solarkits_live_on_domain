import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiShield, FiZap, FiCheckCircle } from 'react-icons/fi';

const FOOTER_LINKS = {
  products: {
    title: 'Products',
    links: [
      { name: 'Solar Inverters', path: '/products?cat=inverters' },
      { name: 'Solar Panels (TOPCon)', path: '/products?cat=panels' },
      { name: 'Mounting Structures', path: '/products?cat=structures' },
      { name: 'DCDB & ACDB Boxes', path: '/products?cat=dcdb' },
      { name: 'DC Cables & MC4', path: '/products?cat=cables' },
      { name: 'BOS Combo Kits', path: '/products?cat=bos-kits' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About SolarKits BOS', path: '/about' },
      { name: 'Distributor Program', path: '/distributor' },
      { name: 'Dealer Network', path: '/dealer' },
      { name: 'Distributor Plans', path: '/plans' },
      { name: 'Contact Us', path: '/contact' },
    ],
  },
  support: {
    title: 'Customer Service',
    links: [
      { name: 'Track Application', path: '/application/status' },
      { name: 'View Cart', path: '/cart' },
      { name: 'Request Bulk Quote', path: '/cart' },
      { name: 'Partner Login', path: '/auth/login' },
      { name: 'Register as Distributor', path: '/auth/register' },
    ],
  },
  policies: {
    title: 'Policies',
    links: [
      { name: 'Privacy Policy', path: '/privacy-policy' },
      { name: 'Terms of Service', path: '/terms-of-service' },
      { name: 'Refund & Returns', path: '/refund-policy' },
      { name: 'Shipping Policy', path: '/shipping-policy' },
    ],
  },
};

const TRUST_BADGES = [
  'GST-Registered Entity',
  'Tier-1 Brands Only',
  'Pan-India Delivery',
  '100% ITC Eligible',
];

export default function Footer() {
  return (
    <footer className="bg-[#F7FAF8] border-t border-[#DDE8E1] text-[#5F6F65]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top section */}
        <div className="pt-14 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 border-b border-[#DDE8E1]">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] group-hover:bg-[#1F8F4E] group-hover:text-white transition-all shadow-xs">
                <FiZap className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xl text-[#17211B] tracking-tight">
                  Solar<span className="text-[#1F8F4E]">Kits</span>
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] rounded-md">
                  BOS
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#5F6F65] leading-relaxed max-w-sm">
              India's trusted solar equipment store. Factory-gate pricing on Tier-1 inverters, TOPCon modules, mounting structures, and complete BOS kits — delivered across India.
            </p>

            {/* Contact details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <FiMapPin className="w-4 h-4 text-[#1F8F4E] shrink-0" />
                <span>National Hub: Ahmedabad, Gujarat, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiPhone className="w-4 h-4 text-[#1F8F4E] shrink-0" />
                <span className="font-semibold text-[#17211B]">+91 (079) 4000-BOSKIT</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiMail className="w-4 h-4 text-[#1F8F4E] shrink-0" />
                <span>support@solarkits.in</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] px-2 py-1 rounded-full"
                >
                  <FiCheckCircle className="w-3 h-3" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-heading text-sm font-bold text-[#17211B] uppercase tracking-wider mb-5">
                {section.title}
              </h4>
              <ul className="space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5F6F65]">
          <p>© {new Date().getFullYear()} SolarKits Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#1F8F4E] font-semibold">
              <FiShield className="w-3.5 h-3.5" />
              GST Verified Entity
            </span>
            <span className="text-[#DDE8E1]">|</span>
            <Link to="/privacy-policy" className="hover:text-[#17211B] transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-[#17211B] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
