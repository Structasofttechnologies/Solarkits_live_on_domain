// src/components/layout/Sidebar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Zap, FileText, Calendar, Wrench,
  Droplets, Settings2, MessageSquare, Activity, Brain, Package,
  DollarSign, BarChart3, Bell, Puzzle, Shield, Settings,
  ChevronLeft, ChevronRight, Sun, Building2, Globe, ChevronDown,
  SwitchCamera,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useIsMobile } from '../../hooks';
import { ROLES, ROLE_LABELS } from '../../constants';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', badge: null },
    ],
  },
  {
    label: 'Customer & Assets',
    items: [
      { icon: Users, label: 'Customers', path: '/customers', badge: null },
      { icon: Zap, label: 'Solar Sites', path: '/sites', badge: null },
      { icon: FileText, label: 'AMC Plans', path: '/amc-plans', badge: null },
      { icon: FileText, label: 'Contracts', path: '/contracts', badge: null },
    ],
  },
  {
    label: 'Operations',
    items: [
      { icon: Calendar, label: 'Visit Scheduling', path: '/schedule', badge: null },
      { icon: Wrench, label: 'Technicians', path: '/technicians', badge: null },
      { icon: Droplets, label: 'Cleaning', path: '/cleaning', badge: null },
      { icon: Settings2, label: 'Maintenance', path: '/maintenance', badge: null },
      { icon: MessageSquare, label: 'Tickets', path: '/tickets', badge: 17 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { icon: Activity, label: 'Remote Monitoring', path: '/monitoring', badge: null },
      { icon: Brain, label: 'AI Analytics', path: '/ai-analytics', badge: 5, badgeVariant: 'warning' },
    ],
  },
  {
    label: 'Inventory & Finance',
    items: [
      { icon: Package, label: 'Spare Parts', path: '/inventory', badge: null },
      { icon: DollarSign, label: 'Finance & Billing', path: '/finance', badge: null },
      { icon: BarChart3, label: 'Reports', path: '/reports', badge: null },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: Bell, label: 'Notifications', path: '/notifications', badge: 8 },
      { icon: Puzzle, label: 'Integrations', path: '/integrations', badge: null },
      { icon: Shield, label: 'Team & Roles', path: '/team', badge: null },
      { icon: Settings, label: 'Settings', path: '/settings', badge: null },
    ],
  },
];

const allRoles = Object.values(ROLES);

export default function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user, switchRole } = useAuthStore();
  const isMobile = useIsMobile();
  const [expandedGroups, setExpandedGroups] = useState(() =>
    Object.fromEntries(navGroups.map(g => [g.label, true]))
  );
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const toggleGroup = (label) => {
    if (sidebarCollapsed) return;
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      className={[
        'fixed top-0 left-0 h-full bg-navy flex flex-col z-30 sidebar-transition',
        sidebarCollapsed ? 'w-16' : 'w-64',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-navy-light/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-solar flex items-center justify-center shrink-0">
            <Sun size={18} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">Emergesun AMC</p>
              <p className="text-xxs text-navy-300 truncate">Solar Lifecycle Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Company / Branch Selector */}
      {!sidebarCollapsed && (
        <div className="px-3 py-3 border-b border-navy-light/30 shrink-0">
          <div className="bg-navy-light/20 rounded-md px-3 py-2">
            <div className="flex items-center gap-2">
              <Building2 size={13} className="text-navy-300 shrink-0" />
              <span className="text-xs text-white font-medium truncate flex-1">
                {user?.company?.name || 'Emergesun Energy'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Globe size={12} className="text-navy-300 shrink-0" />
              <span className="text-xxs text-navy-300 truncate">
                {user?.branch?.name || 'All Branches'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {/* Group label */}
            {!sidebarCollapsed && (
              <button
                className="w-full flex items-center justify-between px-4 py-1.5 text-xxs font-semibold text-navy-300 uppercase tracking-wider hover:text-navy-100 transition-colors"
                onClick={() => toggleGroup(group.label)}
              >
                {group.label}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${expandedGroups[group.label] ? '' : '-rotate-90'}`}
                />
              </button>
            )}
            {/* Items */}
            {(sidebarCollapsed || expandedGroups[group.label]) && (
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <div key={item.path} className="relative group/nav">
                      <Link
                        to={item.path}
                        onClick={handleNavClick}
                        className={[
                          'flex items-center gap-3 rounded-md transition-all duration-150',
                          sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                          active
                            ? 'bg-solar/15 text-white'
                            : 'text-navy-300 hover:text-white hover:bg-white/8',
                        ].join(' ')}
                      >
                        <Icon
                          size={18}
                          className={[
                            'shrink-0 transition-colors',
                            active ? 'text-solar' : '',
                          ].join(' ')}
                        />
                        {!sidebarCollapsed && (
                          <>
                            <span className={`text-sm flex-1 truncate ${active ? 'font-semibold' : 'font-medium'}`}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className={[
                                'text-xxs font-bold px-1.5 py-0.5 rounded-full shrink-0',
                                item.badgeVariant === 'warning'
                                  ? 'bg-solar text-navy'
                                  : 'bg-danger text-white',
                              ].join(' ')}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                      {/* Tooltip in collapsed state */}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 hidden group-hover/nav:block">
                          <div className="bg-navy-dark text-white text-xs px-2.5 py-1.5 rounded shadow-dropdown whitespace-nowrap">
                            {item.label}
                            {item.badge && (
                              <span className="ml-2 bg-danger text-white text-xxs px-1 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Role Switcher (Demo) */}
      {!sidebarCollapsed && (
        <div className="px-3 py-3 border-t border-navy-light/30 shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-navy-light/20 hover:bg-navy-light/30 transition-colors text-left"
            >
              <SwitchCamera size={14} className="text-solar shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xxs text-navy-300">Demo Role</p>
                <p className="text-xs font-medium text-white truncate">
                  {ROLE_LABELS[user?.role] || 'EPC Owner'}
                </p>
              </div>
              <ChevronDown size={12} className={`text-navy-300 transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} />
            </button>
            {showRoleSwitcher && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-navy-dark rounded-lg shadow-dropdown overflow-hidden z-50">
                {allRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => { switchRole(role); setShowRoleSwitcher(false); }}
                    className={[
                      'w-full text-left px-3 py-2 text-xs transition-colors',
                      user?.role === role
                        ? 'bg-solar/20 text-solar font-semibold'
                        : 'text-navy-200 hover:bg-navy-light/30 hover:text-white',
                    ].join(' ')}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center shadow-card hover:shadow-card-md transition-shadow z-40"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={13} className="text-navy" />
        ) : (
          <ChevronLeft size={13} className="text-navy" />
        )}
      </button>
    </aside>
  );
}
