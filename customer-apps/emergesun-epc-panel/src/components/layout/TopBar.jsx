import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, HelpCircle, Globe, ChevronDown, LogOut,
  User, Settings, Shield, AlertCircle, X, Building2, Check
} from 'lucide-react';
import useStore from '../../store/useStore';
import { companies } from '../../mocks/companies';
import { notifications as mockNotifications } from '../../mocks/index';
import { geoData } from '../../mocks/geoData';
import DevRoleSwitcher from '../common/DevRoleSwitcher';
import logoImg from '../../assets/logo.png';

export default function TopBar() {
  const { toggleSidebar, user, logout, selectedCompanyId, selectedCountry,
    setSelectedCompany, setSelectedCountry, notificationCount } = useStore();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [notifs, setNotifs] = useState(mockNotifications);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];
  const countryOptions = selectedCompany?.operatingCountries || ['India'];
  const unreadCount = notifs.filter((n) => !n.read).length;

  const closeAll = () => {
    setShowNotif(false);
    setShowProfile(false);
    setShowCompany(false);
    setShowCountry(false);
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    logout();
    window.location.href = 'http://localhost:5176/login';
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 bg-white border-b border-gray-200/80 shadow-xs h-16 flex items-center px-3 md:px-4 gap-3">
      {/* Brand Logo */}
      <Link to="/dashboard" className="flex items-center pl-1 pr-3 py-1 flex-shrink-0 group hover:opacity-95 transition-opacity">
        <img src={logoImg} alt="EmergeSun" className="h-13 md:h-14 lg:h-[54px] w-auto object-contain max-w-[200px]" />
      </Link>

      {/* Hamburger */}
      <button onClick={toggleSidebar}
        className="btn-icon text-solar-slate hover:text-primary flex-shrink-0">
        <Menu size={20} />
      </button>

      {/* Company Selector */}
      <div className="relative flex-shrink-0">
        <button onClick={() => { closeAll(); setShowCompany(!showCompany); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-solar-border bg-white hover:bg-gray-50 text-sm font-medium text-solar-navy transition-colors">
          <Building2 size={15} className="text-primary" />
          <span className="max-w-[120px] truncate hidden sm:block">{selectedCompany?.name}</span>
          <ChevronDown size={14} className="text-solar-slate" />
        </button>
        {showCompany && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-solar-border rounded-xl shadow-card-hover z-50 animate-fade-in overflow-hidden">
            <div className="p-2 border-b border-solar-border text-xs font-semibold text-solar-slate px-3 py-2 bg-gray-50">Select Company</div>
            {companies.map((c) => (
              <button key={c.id} onClick={() => { setSelectedCompany(c.id); setShowCompany(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 text-sm transition-colors">
                <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{c.code}</div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-solar-navy truncate">{c.name}</div>
                  <div className="text-xs text-solar-slate">{c.subscriptionPlan}</div>
                </div>
                {c.id === selectedCompanyId && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Country Selector */}
      <div className="relative flex-shrink-0">
        <button onClick={() => { closeAll(); setShowCountry(!showCountry); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-solar-border bg-white hover:bg-gray-50 text-sm font-medium text-solar-navy transition-colors">
          <span>{geoData[selectedCountry]?.flag || '🌍'}</span>
          <span className="hidden sm:block">{selectedCountry}</span>
          <ChevronDown size={14} className="text-solar-slate" />
        </button>
        {showCountry && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-solar-border rounded-xl shadow-card-hover z-50 animate-fade-in overflow-hidden">
            <div className="p-2 border-b border-solar-border text-xs font-semibold text-solar-slate px-3 py-2 bg-gray-50">Switch Country</div>
            {countryOptions.map((c) => (
              <button key={c} onClick={() => { setSelectedCountry(c); setShowCountry(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 text-sm transition-colors">
                <span className="text-base">{geoData[c]?.flag}</span>
                <span className="flex-1 text-left font-medium text-solar-navy">{c}</span>
                {c === selectedCountry && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <button onClick={() => setShowSearch(true)}
        className="btn-icon text-solar-slate hover:text-primary hidden sm:flex">
        <Search size={18} />
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => { closeAll(); setShowNotif(!showNotif); }}
          className="btn-icon text-solar-slate hover:text-primary relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
              {unreadCount}
            </span>
          )}
        </button>
        {showNotif && (
          <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-solar-border rounded-xl shadow-card-hover z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-solar-border">
              <span className="font-semibold text-solar-navy">Notifications</span>
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifs.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-primary text-white' : 'bg-gray-100 text-solar-slate'}`}>
                      <Bell size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-solar-navy">{n.title}</p>
                      <p className="text-xs text-solar-slate mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/notifications" onClick={() => setShowNotif(false)}
              className="block text-center text-xs text-primary font-medium py-3 hover:bg-gray-50 transition-colors">
              View all notifications
            </Link>
          </div>
        )}
      </div>

      {/* Help */}
      <button className="btn-icon text-solar-slate hover:text-primary hidden sm:flex">
        <HelpCircle size={18} />
      </button>

      {/* Dev Role Switcher */}
      <DevRoleSwitcher />

      {/* Profile */}
      <div className="relative">
        <button onClick={() => { closeAll(); setShowProfile(!showProfile); }}
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
            {user?.avatar || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-solar-navy leading-tight">{user?.name}</div>
            <div className="text-xs text-solar-slate leading-tight">{user?.role}</div>
          </div>
          <ChevronDown size={14} className="text-solar-slate hidden sm:block" />
        </button>
        {showProfile && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-solar-border rounded-xl shadow-card-hover z-50 animate-fade-in overflow-hidden">
            <div className="px-4 py-3 border-b border-solar-border bg-gray-50">
              <div className="font-semibold text-solar-navy">{user?.name}</div>
              <div className="text-xs text-solar-slate">{user?.email || user?.role}</div>
              <span className="badge-primary mt-1 inline-block">{user?.role}</span>
            </div>
            <Link to="/settings" onClick={() => setShowProfile(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-solar-navy transition-colors">
              <User size={15} /> My Profile
            </Link>
            <Link to="/settings" onClick={() => setShowProfile(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-solar-navy transition-colors">
              <Settings size={15} /> Settings
            </Link>
            <div className="border-t border-solar-border" />
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20 animate-fade-in"
          onClick={() => setShowSearch(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-solar-border">
              <Search size={18} className="text-solar-slate" />
              <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies, users, countries, roles..."
                className="flex-1 outline-none text-sm text-solar-navy placeholder-solar-slate" />
              <button onClick={() => setShowSearch(false)} className="text-solar-slate hover:text-solar-navy">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              {searchQuery ? (
                <div className="space-y-2">
                  {['Companies', 'Users', 'Countries'].map((cat) => (
                    <div key={cat}>
                      <div className="text-xs font-semibold text-solar-slate mb-1">{cat}</div>
                      <div className="text-sm text-solar-navy px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                        Search result for "{searchQuery}" in {cat}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-solar-slate text-sm">
                  Type to search across companies, users, and more...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {(showNotif || showProfile || showCompany || showCountry) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}
    </header>
  );
}
