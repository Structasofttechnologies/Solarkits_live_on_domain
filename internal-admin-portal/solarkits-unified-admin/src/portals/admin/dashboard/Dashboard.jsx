import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import Header from "../components/Header";
import Drawer from "../components/Drawer";
import Loader from "../components/Loader";
import { PermissionGuard } from "../components/PermissionGuard";
import { selectAllowedUniqueIds } from "../features/modules.slice";

import { FaHome, FaIndustry, FaRulerCombined, FaUserPlus, FaUserShield, FaUserTie, FaUsers, FaUsersCog, FaGlobe, FaCoins, FaStore, FaFileContract } from "react-icons/fa";
import {
  MdAccountTree,
  MdEngineering,
  MdLocationOn,
  MdManageAccounts,
  MdQrCode2,
  MdSettings,
  MdTune,
  MdWarehouse,
} from "react-icons/md";
import { FaMagnifyingGlassLocation, FaMapLocationDot } from "react-icons/fa6";
import { BiSolidLayerPlus } from "react-icons/bi";
import { GoProject } from "react-icons/go";
import { HiCube, HiOutlineTemplate, HiSparkles } from "react-icons/hi";
import { FiSmartphone } from "react-icons/fi";

/* ===================== Lazy Pages ===================== */

const Home = lazy(() => import("../pages/dashboard/Home"));
const Operations = lazy(() => import("../pages/dashboard/operations/Operations"));
const Settings = lazy(() => import("../pages/dashboard/settings/Settings"));
const ManageUsers = lazy(() => import("../pages/dashboard/manage-users/ManageUsers"));
const ProductConfigurations = lazy(() => import("../pages/dashboard/product-configurations/ProductConfigurations"));
const AssignTasks = lazy(() => import("../pages/epc-project-management-erp/AssignTasks"));
const Profile = lazy(() => import("../pages/Profile"));
const AccountSettings = lazy(() => import("../pages/AccountSettings"));
const CreateUsers = lazy(() => import("../pages/CreateUsers"));
const WebsiteConfiguration = lazy(() => import("../pages/dashboard/website-configuration/WebsiteConfiguration"));
const AmcPlans = lazy(() => import("../pages/solar-amc-management/AmcPlans"));
const EpcPlans = lazy(() => import("../pages/epc-plans/EpcPlans"));
const NotFound = lazy(() => import("../pages/NotFound"));

/* ===================== MENU CONFIG ===================== */

const menus = [
  [{ name: "Dashboard", icon: <FaHome />, path: "/admin-panel/home", unique_id: "00000000" }],
  [
    {
      name: "Operations",
      icon: <MdEngineering />,
      path: "/admin-panel/operations",
      unique_id: "ADM_OPS",
      subMenu: [
        {
          name: "Company Warehouses",
          icon: <MdWarehouse />,
          path: "/admin-panel/operations/company-warehouses",
          unique_id: "ADM_WAREHOUSES"
        },
        {
          name: "Manufacturing Brands",
          icon: <FaIndustry />,
          path: "/admin-panel/operations/manufacturing-brands",
          unique_id: "ADM_MFG_BRANDS"
        },
      ],
    },
    {
      name: "Settings",
      icon: <MdSettings />,
      path: "/admin-panel/settings",
      unique_id: "ADM_SETTINGS",
      subMenu: [
        {
          name: "Role Settings",
          icon: <FaUsersCog />,
          path: "/admin-panel/settings/role-settings",
          unique_id: "ADM_ROLE_SETTINGS",
          subMenu: [
            {
              name: "Role-Based Access Control",
              icon: <FaUserShield />,
              path: "/admin-panel/settings/role-settings/role-based-access-control",
              unique_id: "ADM_RBAC"
            },
            {
              name: "Departments",
              icon: <MdAccountTree />,
              path: "/admin-panel/settings/role-settings/departments",
              unique_id: "ADM_DEPTS"
            },
          ],
        },
        {
          name: "HR Settings",
          icon: <MdManageAccounts />,
          path: "/admin-panel/settings/hr-settings",
          subMenu: [
            {
              name: "Temporary Incharge Setting",
              icon: <FaUserTie />,
              path: "/admin-panel/settings/hr-settings/temporary-incharge-setting",
              unique_id: "ADM_TEMP_INCHARGE"
            },
          ],
        },
        {
          name: "Location Setting",
          icon: <MdLocationOn />,
          path: "/admin-panel/settings/location-setting",
          unique_id: "ADM_LOC",
          subMenu: [
            {
              name: "Location Overview",
              icon: <FaMagnifyingGlassLocation />,
              path: "/admin-panel/settings/location-setting/location-overview",
              unique_id: "ADM_LOC_OVERVIEW"
            },
            {
              name: "Setup Location",
              icon: <FaMapLocationDot />,
              path: "/admin-panel/settings/location-setting/setup-location",
              unique_id: "ADM_SETUP_LOC"
            },
            {
              name: "Cluster Setup",
              icon: <BiSolidLayerPlus />,
              path: "/admin-panel/settings/location-setting/cluster-setup",
              unique_id: "ADM_CLUSTER_SETUP"
            },
          ],
        }
      ],
    },
    {
      name: "Manage Users",
      icon: <MdManageAccounts />,
      path: "/admin-panel/manage-users",
      unique_id: "ADM_USERS",
      subMenu: [
        {
          name: "EPCs",
          icon: <FaUsers />,
          path: "/admin-panel/manage-users/epcs",
          unique_id: "ADM_EPC"
        },
        {
          name: "Suppliers",
          icon: <FaUsers />,
          path: "/admin-panel/manage-users/suppliers",
          unique_id: "ADM_SUPPLIERS"
        },
      ]
    },
    {
      name: "Product Configurations",
      icon: <MdTune />,
      path: "/admin-panel/product-configuration",
      unique_id: "ADM_PROD_CFG",
      subMenu: [
        {
          name: "Project Types",
          icon: <GoProject />,
          path: "/admin-panel/product-configurations/project-types",
          unique_id: "ADM_PROJ_TYPES"
        },
        {
          name: "Product Templates",
          icon: <HiOutlineTemplate />,
          path: "/admin-panel/product-configurations/product-templates",
          unique_id: "ADM_PROD_TMPL"
        },
        {
          name: "SKU Master",
          icon: <MdQrCode2 />,
          path: "/admin-panel/product-configurations/sku-master",
          unique_id: "ADM_SKU"
        },
        {
          name: "Units Management",
          icon: <FaRulerCombined />,
          path: "/admin-panel/product-configurations/units-management",
          unique_id: "ADM_UNITS"
        },
        {
          name: "Solar Kits",
          icon: <HiCube />,
          path: "/admin-panel/product-configurations/solar-kits",
          unique_id: "ADM_SOLAR_KITS"
        },
        {
          name: "Benchmark Price Master",
          icon: <FaCoins />,
          path: "/admin-panel/product-configurations/price-master",
          unique_id: "ADM_PRICE_MASTER"
        },
        {
          name: "Price Requests",
          icon: <FaCoins />,
          path: "/admin-panel/product-configurations/price-requests",
          unique_id: "ADM_PRICE_REQS"
        }
      ]
    },
    {
      name: "Plans",
      icon: <FaFileContract />,
      path: "/admin-panel/plans",
      unique_id: "ADM_PLANS",
      subMenu: [
        {
          name: "AMC Plans",
          icon: <FaFileContract />,
          path: "/admin-panel/plans/amc-plans",
          unique_id: "ADM_AMC_PLANS"
        }
      ]
    }
  ],
  [
    {
      name: "Website Configuration",
      icon: <FaGlobe />,
      path: "/admin-panel/website-configuration",
      unique_id: "ADM_WEBSITE_CFG",
      subMenu: [
        {
          name: "Header",
          icon: <HiOutlineTemplate />,
          path: "/admin-panel/website-configuration/header",
          unique_id: "ADM_WEBSITE_HEADER",
          subMenu: [
            {
              name: "Hero Section",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/header/hero-section",
              unique_id: "ADM_WEBSITE_HERO"
            },
            {
              name: "ERP Modules",
              icon: <HiCube />,
              path: "/admin-panel/website-configuration/header/erp-modules",
              unique_id: "ADM_WEBSITE_HEADER_ERP"
            },
            {
              name: "Happy Users",
              icon: <FaUsers />,
              path: "/admin-panel/website-configuration/header/happy-users",
              unique_id: "ADM_WEBSITE_HEADER_HAPPY_USERS"
            },
            {
              name: "Key Features",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/header/key-features",
              unique_id: "ADM_WEBSITE_HEADER_KEY_FEATURES"
            },
            {
              name: "ERP Screenshots",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/header/erp-screenshots",
              unique_id: "ADM_WEBSITE_HEADER_ERP_SCREENSHOTS"
            },
            {
              name: "ERP Benefits",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/header/erp-benefits",
              unique_id: "ADM_WEBSITE_HEADER_ERP_BENEFITS"
            },
            {
              name: "Pricing Plans",
              icon: <FaCoins />,
              path: "/admin-panel/website-configuration/header/pricing-plans",
              unique_id: "ADM_WEBSITE_HEADER_PRICING"
            },
            {
              name: "Call To Action",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/header/call-to-action",
              unique_id: "ADM_WEBSITE_HEADER_CTA"
            }
          ]
        },
        {
          name: "About Us",
          icon: <FaUsers />,
          path: "/admin-panel/website-configuration/about-us",
          unique_id: "ADM_WEBSITE_ABOUT",
          subMenu: [
            {
              name: "Main Banner",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/about-us/banner",
              unique_id: "ADM_WEBSITE_ABOUT_BANNER"
            },
            {
              name: "Mission, Vision & Story",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/about-us/mission-vision",
              unique_id: "ADM_WEBSITE_ABOUT_MISSION_VISION"
            },
            {
              name: "Our Values",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/about-us/values",
              unique_id: "ADM_WEBSITE_ABOUT_VALUES"
            },
            {
              name: "Ready To Go Solar",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/about-us/cta",
              unique_id: "ADM_WEBSITE_ABOUT_CTA"
            }
          ]
        },
        {
          name: "Services",
          icon: <MdEngineering />,
          path: "/admin-panel/website-configuration/services",
          unique_id: "ADM_WEBSITE_SERVICES"
        },
        {
          name: "Contact",
          icon: <FaUserTie />,
          path: "/admin-panel/website-configuration/contact",
          unique_id: "ADM_WEBSITE_CONTACT",
          subMenu: [
            {
              name: "Get In Touch",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/contact/hero",
              unique_id: "ADM_WEBSITE_CONTACT_HERO"
            },
            {
              name: "Contact Details",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/contact/details",
              unique_id: "ADM_WEBSITE_CONTACT_DETAILS"
            },
            {
              name: "Map & FAQs",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/contact/map-faqs",
              unique_id: "ADM_WEBSITE_CONTACT_MAP_FAQS"
            }
          ]
        },
        {
          name: "Footer",
          icon: <HiOutlineTemplate />,
          path: "/admin-panel/website-configuration/footer",
          unique_id: "ADM_WEBSITE_FOOTER"
        },
        {
          name: "Installer Marketplace",
          icon: <FaGlobe />,
          path: "/admin-panel/website-configuration/marketplace",
          unique_id: "ADM_WEBSITE_MARKETPLACE",
          subMenu: [
            {
              name: "Hero Section",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/marketplace/hero",
              unique_id: "ADM_WEBSITE_MARKETPLACE_HERO"
            },
            {
              name: "Key Features",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/marketplace/features",
              unique_id: "ADM_WEBSITE_MARKETPLACE_FEATURES"
            },
            {
              name: "How It Works",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/marketplace/steps",
              unique_id: "ADM_WEBSITE_MARKETPLACE_STEPS"
            },
            {
              name: "Why Choose Us",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/marketplace/why-choose",
              unique_id: "ADM_WEBSITE_MARKETPLACE_WHYCHOOSE"
            },
            {
              name: "CTA Section",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/marketplace/cta",
              unique_id: "ADM_WEBSITE_MARKETPLACE_CTA"
            }
          ]
        },
        {
          name: "Solar Dealer App",
          icon: <FiSmartphone />,
          path: "/admin-panel/website-configuration/dealer-app",
          unique_id: "ADM_WEBSITE_DEALER_APP",
          subMenu: [
            {
              name: "Hero Section",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/dealer-app/hero",
              unique_id: "ADM_WEBSITE_DEALER_APP_HERO"
            },
            {
              name: "Features List",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/dealer-app/features",
              unique_id: "ADM_WEBSITE_DEALER_APP_FEATURES"
            },
            {
              name: "App Screenshots",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/dealer-app/screenshots",
              unique_id: "ADM_WEBSITE_DEALER_APP_SCREENSHOTS"
            }
          ]
        },
        {
          name: "Solar Mega Watt",
          icon: <FaGlobe />,
          path: "/admin-panel/website-configuration/megawatt",
          unique_id: "ADM_WEBSITE_MEGAWATT",
          subMenu: [
            {
              name: "Hero & Metrics",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/megawatt/hero",
              unique_id: "ADM_WEBSITE_MEGAWATT_HERO"
            },
            {
              name: "Lifecycle Phases",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/megawatt/phases",
              unique_id: "ADM_WEBSITE_MEGAWATT_PHASES"
            },
            {
              name: "Features List",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/megawatt/features",
              unique_id: "ADM_WEBSITE_MEGAWATT_FEATURES"
            },
            {
              name: "Screenshots Showcase",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/megawatt/screenshots",
              unique_id: "ADM_WEBSITE_MEGAWATT_SCREENSHOTS"
            }
          ]
        },
        {
          name: "Solar AMC",
          icon: <HiOutlineTemplate />,
          path: "/admin-panel/website-configuration/amc",
          unique_id: "ADM_WEBSITE_AMC",
          subMenu: [
            {
              name: "Hero & Metrics",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/amc/hero",
              unique_id: "ADM_WEBSITE_AMC_HERO"
            },
            {
              name: "Features List",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/amc/features",
              unique_id: "ADM_WEBSITE_AMC_FEATURES"
            },
            {
              name: "How It Works",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/amc/process",
              unique_id: "ADM_WEBSITE_AMC_PROCESS"
            },
            {
              name: "Key Benefits",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/amc/benefits",
              unique_id: "ADM_WEBSITE_AMC_BENEFITS"
            },
            {
              name: "Screenshots",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/amc/screenshots",
              unique_id: "ADM_WEBSITE_AMC_SCREENSHOTS"
            }
          ]
        },
        {
          name: "Solar Shop",
          icon: <FaStore />,
          path: "/admin-panel/website-configuration/solar-shop",
          unique_id: "ADM_WEBSITE_SOLARSHOP",
          subMenu: [
            {
              name: "Hero Section",
              icon: <HiSparkles />,
              path: "/admin-panel/website-configuration/solar-shop/hero",
              unique_id: "ADM_WEBSITE_SOLARSHOP_HERO"
            },
            {
              name: "Our Software Solutions",
              icon: <HiOutlineTemplate />,
              path: "/admin-panel/website-configuration/solar-shop/solutions",
              unique_id: "ADM_WEBSITE_SOLARSHOP_SOLUTIONS"
            },
            {
              name: "CRM Modules",
              icon: <HiCube />,
              path: "/admin-panel/website-configuration/solar-shop/crm",
              unique_id: "ADM_WEBSITE_SOLARSHOP_CRM"
            },
            {
              name: "Why Choose Us",
              icon: <FaHome />, // FaHome or FaUserShield is fine, let's use GoProject or FaUserShield
              path: "/admin-panel/website-configuration/solar-shop/why-choose",
              unique_id: "ADM_WEBSITE_SOLARSHOP_WHYCHOOSE"
            },
            {
              name: "Performance Metrics",
              icon: <MdTune />,
              path: "/admin-panel/website-configuration/solar-shop/metrics",
              unique_id: "ADM_WEBSITE_SOLARSHOP_METRICS"
            },
            {
              name: "Testimonials",
              icon: <FaUsersCog />,
              path: "/admin-panel/website-configuration/solar-shop/testimonials",
              unique_id: "ADM_WEBSITE_SOLARSHOP_TESTIMONIALS"
            },
            {
              name: "Call To Action",
              icon: <MdTune />,
              path: "/admin-panel/website-configuration/solar-shop/cta",
              unique_id: "ADM_WEBSITE_SOLARSHOP_CTA"
            }
          ]
        }
      ]
    },
  ],
];

const isModuleAllowed = (menu, allowedUniqueIds) => {
  if (!menu.unique_id) return false;
  return allowedUniqueIds.includes(menu.unique_id) || menu.unique_id === "ADM_WEBSITE_CFG" || menu.unique_id.startsWith("ADM_WEBSITE") || menu.unique_id === "ADM_PLANS" || menu.unique_id === "ADM_AMC_PLANS" || menu.unique_id === "ADM_EPC_PLANS";
};

// Filter menu tree recursively
const filterMenusByPermission = (menus, allowedUniqueIds) => {
  return menus
    .map((group) =>
      group
        .map((menu) => {
          if (menu.subMenu) {
            const filteredSubMenu =
              filterMenusByPermission([menu.subMenu], allowedUniqueIds)[0];

            if (filteredSubMenu?.length > 0 || isModuleAllowed(menu, allowedUniqueIds)) {
              return { ...menu, subMenu: filteredSubMenu };
            }
            return null;
          }

          return isModuleAllowed(menu, allowedUniqueIds) ? menu : null;
        })
        .filter(Boolean)
    )
    .filter((group) => group.length > 0);
};

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const allowedUniqueIds = useSelector((state) => selectAllowedUniqueIds(state, location.pathname));


  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/$/, "");
    if (normalizedPath === "/admin-panel") {
      navigate("/admin-panel/home", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredMenus = filterMenusByPermission(menus, allowedUniqueIds);

  // Dynamic Title detection
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/home')) return 'Home Dashboard';
    if (path.includes('/operations')) return 'Operations Management';
    if (path.includes('/settings')) return 'System Settings';
    if (path.includes('/website-configuration')) return 'Website Configuration';
    if (path.includes('/manage-users')) return 'User Management';
    if (path.includes('/product-configurations')) return 'Product Configuration';
    if (path.includes('/epc-plans')) return 'EPC Plans Management';
    if (path.includes('/amc-plans')) return 'AMC Plans Management';
    if (path.includes('/assign-tasks')) return 'Task Assignment';
    if (path.includes('/profile')) return 'My Profile';
    if (path.includes('/account-settings')) return 'Account Settings';
    return 'Dashboard';
  };

  /* ===================== RENDER ===================== */

  return (
    <div className="flex h-screen bg-bg w-screen theme-transition">
      <Drawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
        menuItems={filteredMenus}
      />

      <div className="flex flex-col flex-1 min-w-0 max-w-full">
        <Header
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isMobile={isMobile}
          title={getPageTitle()}
        />

        <main className="flex-1 relative overflow-hidden mesh-grid bg-bg transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

          <div className="relative h-full overflow-y-auto scrollbar-hover p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="min-h-full"
              >
                <Routes location={location}>
                  <Route
                    path="/home"
                    element={
                      <PermissionGuard requiredUniqueId="00000000">
                        <Suspense fallback={<Loader text="Loading home..." />}>
                          <Home />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/operations/*"
                    element={
                      <PermissionGuard requiredUniqueId="ADM_OPS">
                        <Suspense fallback={<Loader text="Loading operations..." />}>
                          <Operations />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/settings/*"
                    element={
                      <PermissionGuard requiredUniqueId="ADM_ROLE_SETTINGS">
                        <Suspense fallback={<Loader text="Loading settings..." />}>
                          <Settings />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/manage-users/*"
                    element={
                      <PermissionGuard requiredUniqueId="ADM_EPC">
                        <Suspense fallback={<Loader text="Loading users..." />}>
                          <ManageUsers />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/create-users/*"
                    element={
                      <Suspense fallback={<Loader text="Loading user management..." />}>
                        <CreateUsers />
                      </Suspense>
                    }
                  />

                  <Route
                    path="/product-configurations/*"
                    element={
                      <PermissionGuard requiredUniqueId="ADM_PROD_CFG">
                        <Suspense fallback={<Loader text="Loading content..." />}>
                          <ProductConfigurations moduleUniqueId="ADM_PROD_CFG" />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/plans/amc-plans/*"
                    element={
                      <Suspense fallback={<Loader text="Loading AMC plans..." />}>
                        <AmcPlans defaultCategory="All" />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/plans/epc-plans/*"
                    element={
                      <Suspense fallback={<Loader text="Loading EPC plans..." />}>
                        <EpcPlans />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/amc-plans/*"
                    element={
                      <Suspense fallback={<Loader text="Loading AMC plans..." />}>
                        <AmcPlans />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/website-configuration/*"
                    element={
                      <Suspense fallback={<Loader text="Loading website configuration..." />}>
                        <WebsiteConfiguration />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/assign-tasks/*"
                    element={
                      <PermissionGuard requiredUniqueId="ADM_ASSIGN_TASKS">
                        <Suspense fallback={<Loader text="Loading assign tasks..." />}>
                          <AssignTasks />
                        </Suspense>
                      </PermissionGuard>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <Suspense fallback={<Loader text="Loading profile..." />}>
                        <Profile />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/account-settings"
                    element={
                      <Suspense fallback={<Loader text="Loading settings..." />}>
                        <AccountSettings />
                      </Suspense>
                    }
                  />
                  <Route path="*" element={<Suspense fallback={<Loader />}><NotFound /></Suspense>} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
