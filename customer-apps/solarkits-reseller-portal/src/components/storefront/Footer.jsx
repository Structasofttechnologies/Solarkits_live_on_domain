import { Link } from "react-router-dom";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiArrowUp,
  FiCheckCircle,
} from "react-icons/fi";
import logoImg from "../../assets/images/logo.png";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      {/* Top Banner with Trust Badges */}
      <div className="border-b border-slate-800 bg-slate-950/70 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-200 font-bold text-[11px] sm:text-xs">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-[#F49222] shrink-0" size={15} />
              <span>MNRE & ALMM Approved Equipment</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-[#F49222] shrink-0" size={15} />
              <span>28 States Regional Logistics Hubs</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-[#F49222] shrink-0" size={15} />
              <span>100% Paperless Digital GSTIN KYC</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-[#F49222] shrink-0" size={15} />
              <span>T+0 Automated Wallet Payouts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
          
          {/* Column 1: Brand & Bio */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-3 sm:space-y-4">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3">
              <img
                src={logoImg}
                alt="SolarKits Logo"
                className="h-9 sm:h-10 w-auto object-contain brightness-110"
              />
              <div className="flex flex-col border-l border-slate-800 pl-2.5 sm:pl-3">
                <span className="text-xs font-black uppercase text-[#F49222] tracking-wider">
                  Franchisee Portal
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                  Partner Network
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              SolarKits is India's leading unified solar technology platform connecting Tier-1 manufacturers, EPC contractors, and authorized franchisee dealers.
            </p>

            <div className="pt-2 flex items-center gap-2.5 sm:gap-3">
              <Link
                to="/register"
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] text-white font-black text-xs transition-all shadow-md shadow-blue-500/20"
              >
                Join Franchise Network
              </Link>
              <Link
                to="/login"
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
              >
                Partner Login
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Franchise Program</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#plans" className="hover:text-[#F49222] transition-colors">
                  Franchise Plans
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F49222] transition-colors">
                  Wholesale Store
                </a>
              </li>
              <li>
                <a href="#benefits" className="hover:text-[#F49222] transition-colors">
                  Partner Benefits
                </a>
              </li>
              <li>
                <a href="#calculator" className="hover:text-[#F49222] transition-colors">
                  ROI Calculator
                </a>
              </li>
              <li>
                <a href="#how-to-join" className="hover:text-[#F49222] transition-colors">
                  How to Join
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Product Categories */}
          <div className="lg:col-span-3 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Wholesale Catalog</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a href="#products" className="hover:text-[#F49222] transition-colors">
                  Residential 3kW-10kW Kits
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F49222] transition-colors">
                  Commercial 3-Phase Inverters
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F49222] transition-colors">
                  Tier-1 TOPCon & Mono Panels
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F49222] transition-colors">
                  Universal BOS Packages
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-[#F49222] transition-colors">
                  LiFePO4 Lithium Storage
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Regional Presence */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-2.5 sm:space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Franchise Headquarters</h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <FiMapPin className="text-[#F49222] shrink-0 mt-0.5" size={14} />
                <span>SolarKits Tech Park, Sector 62, Noida, Uttar Pradesh, 201309</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-[#F49222] shrink-0" size={14} />
                <span>+91 1800-SOLAR-KIT / +91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="text-[#F49222] shrink-0" size={14} />
                <span>franchise@solarkits.co.in</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-500 text-center sm:text-left">
          <p>© {new Date().getFullYear()} SolarKits India Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms & Conditions</a>
            <button
              onClick={scrollToTop}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 ml-1"
              aria-label="Back to top"
            >
              <FiArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
