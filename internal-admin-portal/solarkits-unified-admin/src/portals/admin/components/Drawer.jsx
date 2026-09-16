import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { MdExpandMore } from "react-icons/md";
import { FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/images/logo.png";

const MotionLink = typeof motion.create === "function" ? motion.create(Link) : motion(Link);

/**
 * Slide-over Drawer / Panel for Forms and Detail Views
 */
function SlideOverDrawer({
  isOpen,
  onClose,
  setIsOpen,
  title,
  children,
  size = "md",
}) {
  const isVisible = Boolean(isOpen);
  const handleClose = onClose || (() => setIsOpen && setIsOpen(false));

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && handleClose) {
        handleClose();
      }
    };
    if (isVisible) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isVisible, handleClose]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    full: "max-w-[95vw]",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`w-screen ${sizeClasses[size] || "max-w-xl"} bg-surface shadow-2xl flex flex-col border-l border-border`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 gradient-primary text-text-inverse shrink-0">
                <h2 className="text-base font-bold tracking-tight">{title || "Form"}</h2>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-text-inverse ml-auto cursor-pointer"
                  aria-label="Close"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto scrollbar-hover">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Sidebar Navigation Drawer
 */
function NavigationDrawer({
  isOpen,
  setIsOpen,
  isMobile,
  menuItems = [],
}) {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (currentPath, itemPath) => {
    if (!itemPath) return false;

    // Skip country slug normalization for global industry content and website configuration pages
    if (
      currentPath.includes("/industry-content/") ||
      itemPath.includes("/industry-content/") ||
      currentPath.includes("/website-configuration") ||
      itemPath.includes("/website-configuration")
    ) {
      return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
    }

    // Normalize current path by removing the country name segment if present
    let normalizedCurrent = currentPath;
    const slugs = [
      "solar-shop",
      "solar-shop-solarkits",
      "solar-shop-bos-kits",
      "solar-shop-boskits",
    ];
    for (const slug of slugs) {
      if (currentPath.includes(`/${slug}/`)) {
        normalizedCurrent = currentPath.replace(new RegExp(`/${slug}/[^/]+`), `/${slug}`);
        break;
      }
    }

    if (normalizedCurrent === itemPath) return true;

    if (normalizedCurrent.startsWith(itemPath + "/")) {
      const remaining = normalizedCurrent.slice(itemPath.length + 1);
      const firstSubSegment = remaining.split("/")[0];
      if (["offers", "inventory"].includes(firstSubSegment)) {
        return false;
      }
      return true;
    }

    return false;
  };

  const checkIsActive = (currentPath, item) => {
    if (!item) return false;
    if (item.path && isPathActive(currentPath, item.path)) {
      return true;
    }
    if (Array.isArray(item.subMenu)) {
      return item.subMenu.some((subItem) => checkIsActive(currentPath, subItem));
    }
    return false;
  };

  const getActiveParents = (items, currentPath) => {
    const activeParents = {};
    const traverse = (list, depth = 0) => {
      let hasActiveChild = false;
      if (!Array.isArray(list)) return false;
      for (const item of list) {
        if (!item) continue;
        let isCurrentActive = false;
        if (item.path && isPathActive(currentPath, item.path)) {
          isCurrentActive = true;
        }
        let isSubActive = false;
        if (Array.isArray(item.subMenu) && item.subMenu.length > 0) {
          isSubActive = traverse(item.subMenu, depth + 1);
          if (isSubActive) {
            activeParents[item.name] = { open: true, depth };
          }
        }
        if (isCurrentActive || isSubActive) {
          hasActiveChild = true;
        }
      }
      return hasActiveChild;
    };
    if (Array.isArray(items)) {
      traverse(items);
    }
    return activeParents;
  };

  const toggleMenu = (name, depth) => {
    setOpenMenus((prev) => {
      const newOpenMenus = { ...prev };

      Object.keys(newOpenMenus).forEach((key) => {
        if (newOpenMenus[key]?.depth === depth) delete newOpenMenus[key];
      });

      const isCurrentlyOpen = prev[name]?.open;
      newOpenMenus[name] = { open: !isCurrentlyOpen, depth };
      return newOpenMenus;
    });
  };

  useEffect(() => {
    if (!Array.isArray(menuItems) || menuItems.length === 0) return;
    const activeParents = {};
    for (const section of menuItems) {
      if (Array.isArray(section)) {
        Object.assign(activeParents, getActiveParents(section, location.pathname));
      }
    }
    if (Object.keys(activeParents).length > 0) {
      setOpenMenus((prev) => {
        const nextOpen = { ...prev };
        Object.keys(activeParents).forEach((name) => {
          if (!nextOpen[name]?.open) {
            nextOpen[name] = { open: true, depth: activeParents[name].depth };
          }
        });
        return nextOpen;
      });
    }
  }, [location.pathname, menuItems]);

  const getTargetPath = (path) => {
    if (!path) return "";
    if (path.includes("/industry-content/") || path.includes("/website-configuration")) {
      return path;
    }
    let targetPath = path;
    const slugs = [
      "solar-shop",
      "solar-shop-solarkits",
      "solar-shop-bos-kits",
      "solar-shop-boskits",
    ];
    for (const slug of slugs) {
      if (targetPath.includes(`/${slug}/`)) {
        const storedCountry = localStorage.getItem("selected_country_admin") || "india";
        targetPath = targetPath.replace(`/${slug}/`, `/${slug}/${storedCountry.toLowerCase()}/`);
      }
    }
    return targetPath;
  };

  const renderMenuItems = (items, depth = 0) => {
    if (!Array.isArray(items)) return null;
    return (
      <ul className={`${depth > 0 ? "ps-2 mt-1 space-y-1" : "px-2 space-y-1"}`}>
        {items.map((item) => {
          if (!item) return null;
          const isActive = checkIsActive(location.pathname, item);
          const isOpen = openMenus[item.name]?.open;
          const hasSub = Array.isArray(item.subMenu) && item.subMenu.length > 0;
          const targetPath = hasSub ? "" : getTargetPath(item.path);

          return (
            <div key={item.name || Math.random()}>
              <li>
                {hasSub ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleMenu(item.name, depth)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap group
                      ${isActive
                        ? "gradient-primary text-white shadow-md shadow-primary/20"
                        : "text-text-secondary bg-transparent hover:bg-surface-hover hover:text-primary"
                      }`}
                  >
                    <div className="flex gap-3 items-center max-w-[calc(100%-20px)]">
                      <span
                        className={`text-xl min-w-6 flex justify-center transition-colors ${
                          isActive ? "text-white" : "text-primary group-hover:scale-110"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={`flex-1 font-semibold text-[13.5px] tracking-tight truncate overflow-hidden text-ellipsis whitespace-nowrap ${
                          isActive ? "text-white" : "text-text-primary"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span
                      className={`text-lg flex justify-center transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <MdExpandMore />
                    </span>
                  </motion.button>
                ) : (
                  <MotionLink
                    to={targetPath}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (isMobile && setIsOpen) setIsOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all duration-300 whitespace-nowrap group
                      ${isActive
                        ? "gradient-primary text-white shadow-md shadow-primary/20"
                        : "text-text-secondary bg-transparent hover:bg-surface-hover hover:text-primary"
                      }`}
                  >
                    <div className="flex gap-3 items-center max-w-full">
                      <span
                        className={`text-xl min-w-6 flex justify-center transition-colors ${
                          isActive ? "text-white" : "text-primary group-hover:scale-110"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={`flex-1 font-semibold text-[13.5px] tracking-tight truncate overflow-hidden text-ellipsis whitespace-nowrap ${
                          isActive ? "text-white" : "text-text-primary"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>
                  </MotionLink>
                )}
              </li>

              {/* Animated submenu open/close */}
              {hasSub && (
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key={item.name}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {renderMenuItems(item.subMenu, depth + 1)}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </ul>
    );
  };

  const items = Array.isArray(menuItems) ? menuItems : [];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-999"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      {/* Drawer container with animation */}
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.aside
            key="drawer"
            initial={{ x: isMobile ? "-100%" : 0 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? "-100%" : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`shadow-xl flex flex-col transition-colors duration-300 ${
              isMobile
                ? "fixed top-0 left-0 h-screen z-1000 bg-surface w-72"
                : "h-screen w-64 bg-surface border-r border-border shrink-0"
            }`}
          >
            {/* Logo */}
            <div className="flex items-center justify-center p-6 border-b border-border min-h-[100px] bg-gradient-to-b from-primary/5 to-transparent">
              <img
                src={logo}
                alt="Logo"
                className="w-32 h-auto hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Menu Sections */}
            <div className="flex-1 overflow-y-auto scrollbar-hover py-4">
              {items.map((section, index) => {
                const sectionList = Array.isArray(section) ? section : [section];
                return (
                  <div
                    key={index}
                    className={`py-1 ${
                      index !== items.length - 1 ? "border-b border-border/50 mb-1" : ""
                    }`}
                  >
                    {renderMenuItems(sectionList)}
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer/Support */}
            <div className="p-4 border-t border-border bg-gradient-to-t from-primary/5 to-transparent">
              <div className="bg-surface-hover rounded-2xl p-4 border border-border/50 group cursor-pointer hover:border-primary/30 transition-all duration-300">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Need Help?
                </p>
                <p className="text-sm text-text-primary font-medium group-hover:text-primary transition-colors">
                  Contact Support
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Dual-Mode Drawer Component:
 * - Slide-Over Mode: when `children` is provided.
 * - Sidebar Navigation Mode: when no `children` is provided.
 */
export default function Drawer(props) {
  if (props.children) {
    return <SlideOverDrawer {...props} />;
  }
  return <NavigationDrawer {...props} />;
}