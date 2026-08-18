import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiShield, FiZap, FiCheckCircle } from 'react-icons/fi';
import logoImg from '../../assets/images/logo.png';

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
    <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] text-[#475569]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top section */}
        <div className="pt-14 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 border-b border-[#E2E8F0]">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src={logoImg}
                alt="SolarKits BOS"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
              <span className="px-2 py-0.5 text-[10px] font-black tracking-wider uppercase bg-[#EFF8FF] text-[#0575B8] border border-[#BAE6FD] rounded-md shadow-2xs">
                BOS
              </span>
            </Link>

            <p className="text-sm text-[#475569] leading-relaxed max-w-sm">
              India's trusted solar equipment store. Factory-gate pricing on Tier-1 inverters, TOPCon modules, mounting structures, and complete BOS kits — delivered across India.
            </p>

            {/* Contact details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <FiMapPin className="w-4 h-4 text-[#0575B8] shrink-0" />
                <span>National Hub: Ahmedabad, Gujarat, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiPhone className="w-4 h-4 text-[#0575B8] shrink-0" />
                <span className="font-semibold text-[#0F172A]">+91 (079) 4000-BOSKIT</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiMail className="w-4 h-4 text-[#0575B8] shrink-0" />
                <span>support@solarkits.in</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#EFF8FF] border border-[#BAE6FD] text-[#0575B8]"
                >
                  <FiCheckCircle className="w-3 h-3 text-[#0575B8]" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([key, group]) => (
            <div key={key} className="space-y-4">
              <p className="font-heading font-bold text-sm text-[#0F172A] uppercase tracking-wider">
                {group.title}
              </p>
              <ul className="space-y-2 text-xs">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-[#475569] hover:text-[#0575B8] transition-colors font-medium hover:underline inline-block py-0.5"
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
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>© {new Date().getFullYear()} SOLARKITS. All rights reserved. Solar equipment wholesale marketplace.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-[#0575B8] transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-[#0575B8] transition-colors">Terms</Link>
            <Link to="/refund-policy" className="hover:text-[#0575B8] transition-colors">Refunds</Link>
            <Link to="/shipping-policy" className="hover:text-[#0575B8] transition-colors">Shipping</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
