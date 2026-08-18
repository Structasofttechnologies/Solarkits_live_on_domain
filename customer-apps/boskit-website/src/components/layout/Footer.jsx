import React from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiShield, FiExternalLink, FiZap } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-[#F7FAF8] border-t border-[#DDE8E1] text-[#5F6F65]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#DDE8E1]">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
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
              India's premier digital B2B solar equipment distribution platform by SolarKits. Empowering regional distributors and authorized dealers with direct factory-gate pricing, verified inventory, and territorial protection.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#1F8F4E] font-semibold">
              <FiShield className="w-4 h-4 text-[#1F8F4E]" />
              <span>Official B2B Platform of SOLARKITS Ecosystem</span>
            </div>
          </div>

          {/* Col 2: Distribution Programs */}
          <div>
            <h4 className="font-heading text-sm font-bold text-[#17211B] uppercase tracking-wider mb-4">Partner Network</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/distributor" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">Distributor Benefits</Link></li>
              <li><Link to="/plans" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">Territorial Distributor Plans</Link></li>
              <li><Link to="/dealer" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">Dealer Network Program</Link></li>
              <li><Link to="/auth/register" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">Apply for Dealership</Link></li>
              <li><Link to="/application/status" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">Track Onboarding Status</Link></li>
            </ul>
          </div>

          {/* Col 3: Solar Equipment */}
          <div>
            <h4 className="font-heading text-sm font-bold text-[#17211B] uppercase tracking-wider mb-4">Equipment Catalogue</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/products?cat=inverters" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">Grid-Tied & Hybrid Inverters</Link></li>
              <li><Link to="/products?cat=panels" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">TOPCon & Bifacial Modules</Link></li>
              <li><Link to="/products?cat=structures" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">Aluminium Rooftop Mounting</Link></li>
              <li><Link to="/products?cat=dcdb" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">IP66 DCDB & ACDB Boxes</Link></li>
              <li><Link to="/products?cat=cables" className="text-[#5F6F65] hover:text-[#1F8F4E] transition-colors font-medium">TUV Solar DC Cables</Link></li>
            </ul>
          </div>

          {/* Col 4: Corporate & Support */}
          <div>
            <h4 className="font-heading text-sm font-bold text-[#17211B] uppercase tracking-wider mb-4">Support & Hubs</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <FiMapPin className="w-4 h-4 text-[#1F8F4E] shrink-0 mt-1" />
                <span className="text-xs text-[#5F6F65]">National Logistics Hub: Ahmedabad, Gujarat, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiPhone className="w-4 h-4 text-[#1F8F4E] shrink-0" />
                <span className="text-xs text-[#5F6F65] font-semibold">+91 (079) 4000-BOSKIT</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiMail className="w-4 h-4 text-[#1F8F4E] shrink-0" />
                <span className="text-xs text-[#5F6F65]">distributors@solarkits.in</span>
              </div>
              <div className="pt-2">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F8F4E] hover:text-[#18733E]"
                >
                  Partner Portal Login <FiExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5F6F65]">
          <p>&copy; {new Date().getFullYear()} SolarKits Technologies Pvt. Ltd. All rights reserved. Registered GST B2B Entity.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-[#17211B] transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-[#17211B] transition-colors">Contact Support</Link>
            <span className="text-[#DDE8E1]">|</span>
            <span className="text-[#1F8F4E] font-medium">GST Compliance Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
