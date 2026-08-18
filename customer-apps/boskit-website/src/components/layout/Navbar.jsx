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
    <div className="absolute top-full left-0 mt-2 w-[480px] bg-white border border-[#DDE8E1] rounded-2xl shadow-lg p-4 grid grid-cols-2 gap-2 z-50">
      {SHOP_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.path}
            to={cat.path}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#ECF8F1] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] shrink-0 group-hover:bg-[#1F8F4E] group-hover:text-white transition-all">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#17211B]">{cat.name}</p>
              <p className="text-[10px] text-[#5F6F65]">{cat.desc}</p>
            </div>
          </Link>
        );
      })}
      <div className="col-span-2 pt-2 border-t border-[#DDE8E1]">
        <Link
          to="/products"
          className="flex items-center justify-center gap-2 text-xs font-bold text-[#1F8F4E] hover:text-[#18733E] py-2"
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
    `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] font-bold'
        : 'text-[#5F6F65] hover:text-[#17211B] hover:bg-[#F7FAF8]'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#DDE8E1] shadow-xs">
      {/* Announcement Bar */}
      {!dismissed && (
        <div className="bg-[#1F8F4E] text-white text-xs font-medium">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-9">
              <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <FiFileText className="w-3.5 h-3.5" /> GST Invoice on every order — 100% ITC eligible
                </span>
                <span className="opacity-40">|</span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <FiTruck className="w-3.5 h-3.5" /> Pan-India dispatch from verified warehouse hubs
                </span>
                <span className="opacity-40">|</span>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <FiPhone className="w-3.5 h-3.5" /> Bulk order assistance available
                </span>
              </div>
              <div className="md:hidden flex items-center gap-1.5 flex-1 justify-center text-[11px]">
                <FiTruck className="w-3 h-3" /> Pan-India shipping | GST Invoice provided
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-4"
                aria-label="Dismiss"
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

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group py-2">
            <div className="w-9 h-9 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] group-hover:bg-[#1F8F4E] group-hover:text-white transition-all shadow-xs">
              <FiZap className="w-4.5 h-4.5 transition-transform group-hover:scale-110" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-lg text-[#17211B] tracking-tight">
                Solar<span className="text-[#1F8F4E]">Kits</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] rounded-md">
                BOS
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {/* Shop dropdown */}
            <div className="relative" ref={shopDropdownRef}>
              <button
                onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  shopDropdownOpen
                    ? 'text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] font-bold'
                    : 'text-[#5F6F65] hover:text-[#17211B] hover:bg-[#F7FAF8]'
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
              className="relative p-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] hover:bg-[#ECF8F1] hover:text-[#1F8F4E] transition-colors"
              aria-label={`Cart, ${itemCount} items`}
            >
              <FiShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F5B700] text-[#17211B] font-black text-[10px] flex items-center justify-center shadow-xs">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={role === 'distributor' ? '/distributor/portal/dashboard' : '/dealer/portal/dashboard'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs transition-all"
                >
                  <FiUserCheck className="w-4 h-4" />
                  My Account
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-[#5F6F65] hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#17211B] hover:bg-[#F7FAF8] border border-[#DDE8E1] transition-all shadow-xs"
                >
                  <FiLogIn className="w-4 h-4 text-[#1F8F4E]" />
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs hover:shadow-md transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/cart"
              className="relative p-2 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B]"
              aria-label="Cart"
            >
              <FiShoppingCart size={17} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F5B700] text-[#17211B] font-black text-[9px] flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#17211B] bg-[#F7FAF8] border border-[#DDE8E1] focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFFFF] border-t border-[#DDE8E1] px-4 pt-4 pb-6 space-y-1 shadow-lg">
          {/* Category quick-links */}
          <p className="text-[10px] font-bold text-[#5F6F65] uppercase tracking-widest px-2 pb-2">Shop</p>
          {SHOP_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.path}
                to={cat.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#17211B] hover:bg-[#ECF8F1]"
              >
                <Icon className="w-4 h-4 text-[#1F8F4E]" />
                {cat.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#DDE8E1] space-y-1">
            <p className="text-[10px] font-bold text-[#5F6F65] uppercase tracking-widest px-2 pb-2">More</p>
            <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#17211B] hover:bg-[#F7FAF8]">
              <FiBox className="w-4 h-4 text-[#1F8F4E]" /> All Products
            </Link>
            <Link to="/about" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#17211B] hover:bg-[#F7FAF8]">
              <FiUser className="w-4 h-4 text-[#1F8F4E]" /> About Us
            </Link>
            <Link to="/contact" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#17211B] hover:bg-[#F7FAF8]">
              <FiPhone className="w-4 h-4 text-[#1F8F4E]" /> Contact
            </Link>
          </div>

          <div className="pt-3 border-t border-[#DDE8E1] flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={role === 'distributor' ? '/distributor/portal/dashboard' : '/dealer/portal/dashboard'}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-bold bg-[#1F8F4E] text-white shadow-xs flex items-center justify-center gap-2"
                >
                  <FiUserCheck className="w-4 h-4" />
                  My Account ({role === 'distributor' ? 'Distributor' : 'Dealer'})
                </Link>
                <button
                  onClick={logout}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-red-600 bg-red-50 border border-red-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-[#17211B] bg-[#F7FAF8] border border-[#DDE8E1]"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  className="w-full py-2.5 rounded-xl text-center text-sm font-bold bg-[#1F8F4E] text-white shadow-xs"
                >
                  Get Started — Join as Distributor
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
