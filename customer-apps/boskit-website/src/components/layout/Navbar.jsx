import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  FiZap, FiBox, FiMenu, FiX, FiLogIn, FiUserCheck, FiLogOut,
  FiShoppingCart, FiChevronDown, FiPackage, FiLayers, FiGrid,
  FiRadio, FiUser, FiPhone, FiFileText, FiTruck,
} from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';
import logoImg from '../../assets/images/logo.png';

// Shop categories for mega dropdown
const SHOP_CATEGORIES = [
  { name: 'Solar Inverters', desc: 'String, hybrid & micro', icon: FiZap, path: '/products?cat=inverters' },
  { name: 'Solar Panels', desc: 'TOPCon, PERC & bifacial', icon: MdSolarPower, path: '/products?cat=panels' },
  { name: 'Mounting Structures', desc: 'Rooftop & ground mount', icon: FiGrid, path: '/products?cat=structures' },
  { name: 'DCDB & ACDB', desc: 'Protection & switchgear', icon: FiBox, path: '/products?cat=dcdb' },
  { name: 'DC Cables', desc: 'TUV solar DC cables & MC4', icon: FiRadio, path: '/products?cat=cables' },
  { name: 'BOS Combo Kits', desc: 'Pre-engineered complete kits', icon: FiLayers, path: '/products?cat=bos-kits' },
];

function CategoryDropdown({ isOpen }) {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full left-0 mt-2 w-[480px] bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-4 grid grid-cols-2 gap-2 z-50">
      {SHOP_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.path}
            to={cat.path}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#EFF8FF] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EFF8FF] border border-[#BAE6FD] flex items-center justify-center text-[#0575B8] shrink-0 group-hover:bg-[#0575B8] group-hover:text-white transition-all">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F172A]">{cat.name}</p>
              <p className="text-[10px] text-[#64748B]">{cat.desc}</p>
            </div>
          </Link>
        );
      })}
      <div className="col-span-2 pt-2 border-t border-[#E2E8F0]">
        <Link
          to="/products"
          className="flex items-center justify-center gap-2 text-xs font-bold text-[#0575B8] hover:text-[#045D93] py-2"
        >
          <FiPackage className="w-3.5 h-3.5" />
          View Full Equipment Catalogue →
        </Link>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();
  const { user, role, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const shopDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target)) {
        setShopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShopDropdownOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname.startsWith(path);

  const navLinkClass = (path) =>
    `px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
      isActive(path)
        ? 'text-[#0575B8] bg-[#EFF8FF] border border-[#BAE6FD] font-bold'
        : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
      {/* Announcement Bar */}
      {!dismissed && (
        <div className="bg-gradient-to-r from-[#0575B8] via-[#1965B0] to-[#224089] text-white text-xs font-medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-9">
              <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <FiFileText className="w-3.5 h-3.5 text-[#F49222]" />
                  <span>GST Invoice on every order — 100% ITC eligible</span>
                </span>
                <span className="text-white/40">|</span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <FiTruck className="w-3.5 h-3.5 text-[#F49222]" />
                  <span>Pan-India dispatch from verified warehouse hubs</span>
                </span>
                <span className="text-white/40">|</span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <FiPhone className="w-3.5 h-3.5 text-[#F49222]" />
                  <span>Bulk order assistance available</span>
                </span>
              </div>
              <div className="flex md:hidden items-center gap-2 flex-1 justify-center text-[11px]">
                <FiTruck className="w-3.5 h-3.5 text-[#F49222]" />
                <span>Pan-India B2B Solar Equipment Dispatch</span>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-white/70 hover:text-white p-1 rounded transition-colors ml-4"
                aria-label="Dismiss banner"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Official SolarKits Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group py-2" aria-label="SolarKits BOS Home">
            <img
              src={logoImg}
              alt="SolarKits - A Solar Marketplace"
              className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <span className="px-2 py-0.5 text-[10px] font-black tracking-wider uppercase bg-[#EFF8FF] text-[#0575B8] border border-[#BAE6FD] rounded-md shadow-2xs">
              BOS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {/* Shop dropdown */}
            <div className="relative" ref={shopDropdownRef}>
              <button
                onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  shopDropdownOpen
                    ? 'text-[#0575B8] bg-[#EFF8FF] border border-[#BAE6FD] font-bold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                Shop
                <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${shopDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <CategoryDropdown isOpen={shopDropdownOpen} />
            </div>

            <Link to="/products" className={navLinkClass('/products')}>All Products</Link>
            <Link to="/about" className={navLinkClass('/about')}>About</Link>
            <Link to="/contact" className={navLinkClass('/contact')}>Contact</Link>
            <Link to="/cart" className={navLinkClass('/cart')}>Bulk Quote</Link>
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] hover:bg-[#EFF8FF] hover:text-[#0575B8] transition-colors"
              aria-label={`Cart, ${itemCount} items`}
            >
              <FiShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F49222] text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth status buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {role === 'distributor' && (
                  <Link
                    to="/distributor/portal/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EFF8FF] border border-[#BAE6FD] text-[#0575B8] text-sm font-bold hover:bg-[#0575B8] hover:text-white transition-all shadow-xs"
                  >
                    <FiUserCheck size={16} />
                    <span>Distributor Portal</span>
                  </Link>
                )}
                {role === 'dealer' && (
                  <Link
                    to="/dealer/dashboard"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EFF8FF] border border-[#BAE6FD] text-[#0575B8] text-sm font-bold hover:bg-[#0575B8] hover:text-white transition-all shadow-xs"
                  >
                    <FiUserCheck size={16} />
                    <span>Dealer Console</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                >
                  <FiLogIn size={15} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/auth/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[#0575B8] hover:bg-[#045D93] text-white transition-all shadow-xs hover:shadow-md active:scale-98"
                >
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]"
              aria-label={`Cart, ${itemCount} items`}
            >
              <FiShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#F49222] text-white font-black text-[9px] flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="space-y-1">
            <Link
              to="/products"
              className="block px-3 py-2 rounded-xl text-sm font-bold text-[#0F172A] hover:bg-[#EFF8FF] hover:text-[#0575B8]"
            >
              All Products
            </Link>
            <div className="pl-3 py-1 space-y-1">
              {SHOP_CATEGORIES.map((c) => (
                <Link
                  key={c.path}
                  to={c.path}
                  className="block px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0575B8]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <Link
              to="/about"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
            >
              Contact
            </Link>
            <Link
              to="/cart"
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
            >
              Bulk Quote
            </Link>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            {isAuthenticated ? (
              <>
                {role === 'distributor' && (
                  <Link
                    to="/distributor/portal/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0575B8] text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <FiUserCheck size={16} />
                    Distributor Portal
                  </Link>
                )}
                {role === 'dealer' && (
                  <Link
                    to="/dealer/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0575B8] text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <FiUserCheck size={16} />
                    Dealer Console
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full py-2 px-4 rounded-xl border border-[#E2E8F0] text-[#DC2626] text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <FiLogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth/login"
                  className="py-2.5 px-3 rounded-xl border border-[#E2E8F0] text-[#0F172A] text-sm font-bold text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  className="py-2.5 px-3 rounded-xl bg-[#0575B8] text-white text-sm font-bold text-center"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
