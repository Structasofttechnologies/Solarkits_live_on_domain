import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  FiZap,
  FiBox,
  FiUsers,
  FiBriefcase,
  FiLayers,
  FiSearch,
  FiMenu,
  FiX,
  FiLogIn,
  FiUserCheck,
  FiLogOut,
  FiShield,
  FiShoppingCart,
} from 'react-icons/fi';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, role, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();

  const navLinks = [
    { name: 'Products', path: '/products', icon: FiBox },
    { name: 'Distributor Program', path: '/distributor', icon: FiUsers },
    { name: 'Dealer Network', path: '/dealer', icon: FiBriefcase },
    { name: 'Distributor Plans', path: '/plans', icon: FiLayers },
    { name: 'Track Application', path: '/application/status', icon: FiSearch },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#DDE8E1] transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Clean SolarKits BOS Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group py-2">
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

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive(link.path)
                  ? 'text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] font-bold'
                  : 'text-[#5F6F65] hover:text-[#17211B] hover:bg-[#F7FAF8]'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">

            {/* Cart Link */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] hover:bg-[#ECF8F1] hover:text-[#1F8F4E] transition-colors"
              title="Wholesale Cart"
            >
              <FiShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#F5B700] text-[#17211B] font-black text-[10px] flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#17211B]">{user?.business_name || user?.email}</p>
                  <p className="text-[11px] text-[#1F8F4E] font-medium capitalize">{role} Portal</p>
                </div>
                <Link
                  to={role === 'distributor' ? '/distributor/portal/dashboard' : '/dealer/portal/dashboard'}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm flex items-center gap-2 transition-all"
                >
                  <FiUserCheck className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-[#5F6F65] hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#17211B] hover:bg-[#F7FAF8] border border-[#DDE8E1] flex items-center gap-2 transition-all shadow-xs"
                >
                  <FiLogIn className="w-4 h-4 text-[#1F8F4E]" />
                  Portal Login
                </Link>
                <Link
                  to="/auth/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-98 transition-all flex items-center gap-2"
                >
                  <FiShield className="w-4 h-4 text-[#F5B700]" />
                  Become a Distributor
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#17211B] hover:bg-[#F7FAF8] bg-[#F7FAF8] border border-[#DDE8E1] focus:outline-none"
            >
              {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFFFF] border-b border-[#DDE8E1] px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium ${isActive(link.path)
                ? 'text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] font-bold'
                : 'text-[#17211B] hover:bg-[#F7FAF8]'
                }`}
            >
              {link.icon && <link.icon className="w-5 h-5 text-[#1F8F4E]" />}
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-[#DDE8E1] flex flex-col gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  to={role === 'distributor' ? '/distributor/dashboard' : '/dealer/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl text-center text-sm font-bold bg-[#1F8F4E] text-white shadow-sm flex items-center justify-center gap-2"
                >
                  <FiUserCheck className="w-4 h-4" />
                  Open {role === 'distributor' ? 'Distributor' : 'Dealer'} Portal
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-red-600 bg-red-50 border border-red-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-[#17211B] bg-[#F7FAF8] hover:bg-[#ECF8F1] border border-[#DDE8E1]"
                >
                  Portal Login
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-xl text-center text-sm font-bold bg-[#1F8F4E] text-white shadow-sm"
                >
                  Become a Distributor
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
