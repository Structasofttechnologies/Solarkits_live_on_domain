// components/Drawer.jsx
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaLock } from "react-icons/fa";
import { FiX, FiZap } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { setShowAuthDialog } from "@/features/slice";

export default function Drawer({ isOpen, setIsOpen, isMobile, menuItems = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth_slice);

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
            className="fixed top-0 left-0 h-screen z-[1000] bg-surface w-72 shadow-2xl border-r border-border flex flex-col"
          >
            {/* Header / Brand */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-info/10 flex items-center justify-center">
                  <FiZap className="text-primary dark:text-info w-4 h-4" />
                </div>
                <span className="font-bold text-base text-text-primary dark:text-info tracking-tight">
                  Solar<span className="text-primary dark:text-info">Kits</span> Store
                </span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-label="Close menu"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-3 py-1.5">
                Categories & Tools
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isLocked = item.requiresAuth && !isAuthenticated;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-info/10 dark:text-info font-bold"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <span className="text-lg">
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
            </div>

            {/* Bottom info */}
            <div className="p-4 border-t border-border text-xs text-text-muted">
              Pan-India Tier-1 Solar Store
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}