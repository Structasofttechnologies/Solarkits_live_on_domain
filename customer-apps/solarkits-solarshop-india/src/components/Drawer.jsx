// components/Drawer.jsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaLock } from "react-icons/fa";
import {
  FiX,
  FiZap,
  FiUser,
  FiSun,
  FiMoon,
  FiPhoneCall,
  FiMapPin,
  FiShoppingCart,
  FiLayers,
  FiTruck,
  FiSliders,
  FiLogOut
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { setShowAuthDialog } from "@/features/slice";
import { useTheme } from "@/hooks/useTheme";
import { logout } from "@/features/auth.slice";
import logo from "@/assets/images/logo.png";

export default function Drawer({ isOpen, setIsOpen, isMobile, menuItems = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated } = useSelector((state) => state.auth_slice);
  const cart = useSelector((state) => state.slice.cart || []);

  // Flatten menuItems if passed as array of arrays or single array
  const items = Array.isArray(menuItems[0]) ? menuItems.flat() : menuItems;

  const handleItemClick = (item) => {
    if (item.requiresAuth && !isAuthenticated) {
      dispatch(setShowAuthDialog(true));
      return;
    }
    navigate(item.path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsOpen(false);
    navigate("/");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999] transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full w-[82vw] max-w-xs z-[1000] bg-surface shadow-2xl border-r border-border flex flex-col justify-between"
          >
            {/* Top Brand Header */}
            <div>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2"
                >
                  <img
                    src={logo}
                    alt="SOLARKITS"
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  aria-label="Close menu"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* User Account Tile */}
              <div className="p-3 border-b border-border bg-surface-hover/50">
                {isAuthenticated && user ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=0575B8&color=ffffff&bold=true`}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border border-primary/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">{user.name}</p>
                        <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger-soft text-xs"
                      title="Sign Out"
                    >
                      <FiLogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/auth/login");
                    }}
                    className="w-full py-2 px-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <FiUser size={14} />
                    <span>Sign In to Your Account</span>
                  </button>
                )}
              </div>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 py-1">
                Solar Kit Categories
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isLocked = item.requiresAuth && !isAuthenticated;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-info/10 dark:text-info font-bold"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && (
                        <span className="text-base text-primary/80">
                          {typeof Icon === "function" ? <Icon /> : Icon}
                        </span>
                      )}
                      <span>{item.name}</span>
                    </div>
                    {isLocked && (
                      <span className="text-xs text-warning">
                        <FaLock />
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 pt-3 pb-1">
                Help & Services
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/store-locator");
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary hover:bg-surface-hover text-left"
              >
                <FiMapPin size={15} className="text-secondary" />
                <span>Find Nearby Stores</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/kit-finder");
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary hover:bg-surface-hover text-left"
              >
                <FiSliders size={15} className="text-primary" />
                <span>Solar Kit Sizing Tool</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/cart");
                }}
                className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary hover:bg-surface-hover text-left"
              >
                <div className="flex items-center gap-2.5">
                  <FiShoppingCart size={15} className="text-primary" />
                  <span>Shopping Cart</span>
                </div>
                {cart.length > 0 && (
                  <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>

            {/* Bottom info & Theme Switcher */}
            <div className="p-3 border-t border-border bg-surface-hover/40 flex items-center justify-between gap-2">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary bg-surface border border-border"
              >
                {isDark ? <FiSun size={14} className="text-amber-400" /> : <FiMoon size={14} />}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <a
                href="tel:1800-SOLAR-KIT"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-secondary bg-secondary-soft border border-secondary/20"
              >
                <FiPhoneCall size={13} />
                <span>Help</span>
              </a>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}