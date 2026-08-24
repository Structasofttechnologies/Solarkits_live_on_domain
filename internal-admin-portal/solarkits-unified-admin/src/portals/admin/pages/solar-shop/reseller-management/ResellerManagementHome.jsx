import { FiUsers, FiTag, FiFileText, FiMapPin, FiPackage, FiDollarSign, FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const QUICK_LINKS = [
  {
    label: "Franchisee Leads",
    description: "Inbound territory and franchise applications",
    icon: FiInbox,
    path: "/admin-panel/solar-shop/reseller-management/leads",
    color: "text-danger",
    bg: "bg-danger-soft",
  },
  {
    label: "Franchisee Accounts",
    description: "View and manage active franchisees & KYC",
    icon: FiUsers,
    path: "/admin-panel/solar-shop/reseller-management/resellers",
    color: "text-success",
    bg: "bg-success-soft",
  },
  {
    label: "Franchisee Plans",
    description: "Plan tiers, subscriptions and pricing",
    icon: FiFileText,
    path: "/admin-panel/solar-shop/reseller-management/plans",
    color: "text-warning",
    bg: "bg-warning-soft",
  },
  {
    label: "Plan PO Order Settings",
    description: "Configure PO ordering permissions, limits & payment terms",
    icon: FiPackage,
    path: "/admin-panel/solar-shop/reseller-management/fpo/po-settings",
    color: "text-primary",
    bg: "bg-info-soft",
  },
  {
    label: "Project-Type MOQ & Increments",
    description: "Set project-type-wise minimum orders & batch increments",
    icon: FiPackage,
    path: "/admin-panel/solar-shop/reseller-management/fpo/moq-rules",
    color: "text-warning",
    bg: "bg-warning-soft",
  },
  {
    label: "Monthly Kit Targets & Goals",
    description: "Plan, state, district & franchisee kit goals & progress",
    icon: FiFileText,
    path: "/admin-panel/solar-shop/reseller-management/fpo/kit-targets",
    color: "text-primary",
    bg: "bg-info-soft",
  },
  {
    label: "Performance Tracker & Alerts",
    description: "State & district performance analytics and automated alerts",
    icon: FiUsers,
    path: "/admin-panel/solar-shop/reseller-management/fpo/performance",
    color: "text-danger",
    bg: "bg-danger-soft",
  },
  {
    label: "Territory Management",
    description: "Geographic territory assignment & exclusivity",
    icon: FiMapPin,
    path: "/admin-panel/solar-shop/reseller-management/territories",
    color: "text-primary",
    bg: "bg-info-soft",
  },
  {
    label: "Product Authorization",
    description: "Franchisee-product access matrix",
    icon: FiPackage,
    path: "/admin-panel/solar-shop/reseller-management/product-auth",
    color: "text-success",
    bg: "bg-success-soft",
  },
];

export default function ResellerManagementHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <FiUsers className="text-primary" size={24} />
          Franchisee Management
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Manage franchisees, commission structures, territories, and product authorizations
        </p>
      </div>

      {/* Phase 1 status banner */}
      <div className="bg-info-soft border border-info/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-info/10 flex items-center justify-center">
          <span className="text-xl">🚀</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Phase 1 Complete</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Roles, permissions, and configuration masters are live. Franchisee registration, KYC,
            commission engine, and territory management are coming in Phases 2–8.
          </p>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !link.comingSoon && navigate(link.path)}
                disabled={link.comingSoon}
                className={`relative text-left bg-surface rounded-2xl border border-border p-5 transition-all group
                  ${link.comingSoon
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer"
                  }`}
              >
                {link.comingSoon && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border">
                    Coming Soon
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={link.color} />
                </div>
                <p className="text-sm font-semibold text-text-primary">{link.label}</p>
                <p className="text-xs text-text-muted mt-1">{link.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
