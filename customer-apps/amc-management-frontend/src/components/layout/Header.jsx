// src/components/layout/Header.jsx
import { useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search, Bell, ChevronDown, Plus, User, LogOut, Settings,
  Sun, Users, Zap, FileText, Calendar, MessageSquare, DollarSign,
  HelpCircle, Building2, Menu, Globe, Check
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useClickOutside, useIsMobile } from '../../hooks';
import { notifications } from '../../mocks/data';
import { formatRelativeTime } from '../../utils/formatters';
import { ROLE_LABELS, ALL_COUNTRIES } from '../../constants';

const breadcrumbMap = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/sites': 'Solar Sites',
  '/amc-plans': 'AMC Plans',
  '/contracts': 'Contracts',
  '/schedule': 'Visit Scheduling',
  '/technicians': 'Technicians',
  '/cleaning': 'Cleaning',
  '/maintenance': 'Maintenance',
  '/tickets': 'Tickets',
  '/monitoring': 'Remote Monitoring',
  '/ai-analytics': 'AI Analytics',
  '/inventory': 'Spare Parts',
  '/warranties': 'Warranties',
  '/finance': 'Finance & Billing',
  '/invoices': 'Invoices',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/integrations': 'Integrations',
  '/team': 'Team & Roles',
  '/roles': 'Roles',
  '/settings': 'Settings',
  '/subscription': 'Subscription',
  '/customer-portal': 'Customer Portal',
  '/technician-app': 'Technician App',
};

const quickCreateItems = [
  { icon: Users, label: 'Add Customer', path: '/customers' },
  { icon: Zap, label: 'Add Solar Site', path: '/sites' },
  { icon: FileText, label: 'Create Contract', path: '/contracts/new' },
  { icon: Calendar, label: 'Schedule Visit', path: '/schedule' },
  { icon: MessageSquare, label: 'Create Ticket', path: '/tickets' },
  { icon: Users, label: 'Add Technician', path: '/technicians' },
  { icon: DollarSign, label: 'Create Invoice', path: '/finance' },
];

function getBreadcrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Emergesun AMC', path: '/dashboard' }];
  let current = '';
  for (const part of parts) {
    current += '/' + part;
    if (current === '/dashboard') continue;
    const label = breadcrumbMap[current] || (
      part.length > 20 ? `${part.substring(0, 8)}...` : part.replace(/-/g, ' ')
    );
    crumbs.push({ label, path: current });
  }
  return crumbs;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, setSidebarOpen, activeCountry, setActiveCountry } = useUIStore();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [readNotifs, setReadNotifs] = useState(new Set());
  const [countrySearch, setCountrySearch] = useState('');

  const createRef = useRef(null);
  const countryRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useClickOutside(createRef, () => setShowCreate(false));
  useClickOutside(countryRef, () => setShowCountryMenu(false));
  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(userRef, () => setShowUserMenu(false));

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const unreadCount = notifications.filter(n => !n.isRead && !readNotifs.has(n.id)).length;
  const currentTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Emergesun AMC';
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? '4rem' : '16rem');

  // Active country fallback
  const currentCountry = activeCountry || { code: 'IN', name: 'India', flag: '🇮🇳' };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllRead = () => {
    setReadNotifs(new Set(notifications.map(n => n.id)));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredCountries = ALL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <header
      className="fixed top-0 right-0 h-14 bg-white border-b border-border shadow-header z-20 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 transition-all duration-250"
      style={{ left: sidebarWidth }}
      id="app-header"
    >
      {/* Mobile menu button */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary shrink-0"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Page Title */}
        <span className="md:hidden font-semibold text-navy text-sm truncate capitalize">
          {currentTitle}
        </span>

        {/* Desktop Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm flex-1 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.path}-${i}`} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <span className="text-text-muted">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-navy capitalize truncate">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-text-secondary hover:text-navy transition-colors capitalize truncate">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="h-8 w-64 pl-3 pr-8 rounded border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar/30 focus:border-solar"
              placeholder="Search customers, sites, tickets..."
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded hover:bg-gray-100 text-text-secondary hover:text-navy transition-colors"
              title="Global search"
            >
              <Search size={17} />
            </button>
          )}
        </div>

        {/* Quick Create Button */}
        <div ref={createRef} className="relative">
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-solar text-white text-xs font-medium hover:bg-solar-dark transition-colors shadow-2xs"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Create</span>
          </button>
          {showCreate && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-dropdown border border-border z-50 animate-slide-up overflow-hidden">
              <p className="px-3 py-2 text-xxs font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                Quick Create
              </p>
              {quickCreateItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setShowCreate(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                >
                  <item.icon size={15} className="text-text-secondary" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Country Selector Pill (as requested by user) */}
        <div ref={countryRef} className="relative">
          <button
            onClick={() => setShowCountryMenu(v => !v)}
            className="flex items-center gap-2 h-8 px-3 rounded-full border border-border/80 bg-white hover:bg-gray-50 hover:border-gray-300 text-navy transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-solar/20"
            title="Switch Operating Country"
          >
            <span className="text-xs font-bold text-navy tracking-tight">{currentCountry.code}</span>
            <span className="text-xs font-medium text-navy hidden sm:inline">{currentCountry.name}</span>
            <ChevronDown size={13} className="text-text-secondary ml-0.5" />
          </button>

          {showCountryMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-dropdown border border-border z-50 animate-slide-up overflow-hidden">
              <div className="p-3 border-b border-border/80 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Globe size={14} className="text-solar" />
                    Select Region
                  </span>
                  <button
                    onClick={() => { navigate('/settings'); setShowCountryMenu(false); }}
                    className="text-xxs text-solar font-medium hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full h-7 pl-8 pr-3 text-xs rounded-md border border-border bg-white focus:outline-none focus:border-solar"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                {filteredCountries.map(c => {
                  const isSelected = currentCountry.code === c.code;
                  return (
                    <button
                      key={c.code}
                      onClick={() => {
                        setActiveCountry({ code: c.code, name: c.name, flag: c.flag });
                        setShowCountryMenu(false);
                        setCountrySearch('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-solar/10 text-navy font-semibold'
                          : 'text-text-primary hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base leading-none">{c.flag}</span>
                        <span className="font-bold text-xxs px-1 py-0.5 rounded bg-gray-100 text-navy">
                          {c.code}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-solar shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-navy transition-colors" title="Help Center">
          <HelpCircle size={17} />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary hover:text-navy transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-xxs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-dropdown border border-border z-50 animate-slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-navy">Notifications</h3>
                <button onClick={markAllRead} className="text-xs text-solar hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 6).map(notif => {
                  const isUnread = !notif.isRead && !readNotifs.has(notif.id);
                  const severityColor = {
                    critical: 'bg-danger',
                    high: 'bg-warning',
                    medium: 'bg-info',
                    low: 'bg-gray-300',
                  }[notif.priority] || 'bg-gray-300';
                  return (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 ${isUnread ? 'bg-blue-50/40' : ''}`}
                      onClick={() => setReadNotifs(prev => new Set([...prev, notif.id]))}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isUnread ? severityColor : 'bg-gray-200'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy leading-snug">{notif.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                          <p className="text-xxs text-text-muted mt-1">{formatRelativeTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-t border-border">
                <Link
                  to="/notifications"
                  className="text-xs text-solar font-medium hover:underline"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2 h-8 pl-2 pr-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center text-xxs font-bold text-white shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-navy leading-none">{user?.name?.split(' ')[0]}</p>
              <p className="text-xxs text-text-secondary leading-none mt-0.5">{ROLE_LABELS[user?.role]}</p>
            </div>
            <ChevronDown size={13} className="text-text-secondary hidden md:block" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-dropdown border border-border z-50 animate-slide-up overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-navy">{user?.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
                <p className="text-xxs text-solar font-medium mt-1">{ROLE_LABELS[user?.role]}</p>
              </div>
              {[
                { icon: User, label: 'My Profile', action: () => navigate('/settings') },
                { icon: Building2, label: 'Company Settings', action: () => navigate('/settings') },
                { icon: Settings, label: 'Preferences', action: () => navigate('/settings') },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
                >
                  <item.icon size={15} className="text-text-secondary" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger-50 transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
