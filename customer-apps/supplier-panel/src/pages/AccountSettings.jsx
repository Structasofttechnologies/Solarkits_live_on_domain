import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { MdSettings, MdSecurity, MdNotifications, MdPalette, MdTranslate, MdDevices } from "react-icons/md";
import { FaShieldAlt, FaKey, FaBell, FaSun, FaGlobe, FaChevronRight } from "react-icons/fa";
import Button from "../components/Button";
import useTheme from "../hooks/useTheme";

export default function AccountSettings() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  const settingGroups = [
    {
      title: 'Security & Access',
      icon: <MdSecurity className="text-primary" />,
      settings: [
        { name: 'Change Password', desc: 'Update your login credentials', icon: <FaKey /> },
        { name: 'Two-Factor Auth', desc: 'Add an extra layer of security', icon: <FaShieldAlt />, status: 'Disabled' },
      ]
    },
    {
      title: 'Preferences',
      icon: <MdPalette className="text-secondary" />,
      settings: [
        { name: 'Appearance', desc: `Current theme: ${theme}`, icon: <FaSun />, action: toggleTheme },
        { name: 'Language', desc: 'English (India)', icon: <FaGlobe /> },
      ]
    },
    {
      title: 'System Notifications',
      icon: <MdNotifications className="text-success" />,
      settings: [
        { name: 'Order Alerts', desc: 'Get notified for new purchase orders', icon: <FaBell />, toggle: true },
        { name: 'Security Alerts', desc: 'Login attempts and password changes', icon: <MdSecurity />, toggle: true },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-20 max-w-5xl">
      <PageHeader 
        title="Account Settings" 
        subtitle="Configure your portal preferences and security parameters." 
        icon={MdSettings}
        actions={
          <Button variant="primary" className="rounded-xl font-black uppercase tracking-widest text-xs h-12 px-10 shadow-xl shadow-primary/20">
            Save All Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-8">
        {settingGroups.map((group, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shadow-sm border border-border/50">
                {group.icon}
              </div>
              <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">{group.title}</h3>
            </div>

            <div className="card bg-surface border-border divide-y divide-border/50 overflow-hidden">
              {group.settings.map((setting, sIdx) => (
                <div 
                  key={sIdx} 
                  className="flex items-center justify-between p-6 hover:bg-surface-hover/50 transition-all cursor-pointer group"
                  onClick={setting.action}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center text-lg text-text-secondary group-hover:scale-110 transition-transform">
                      {setting.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-text-primary uppercase tracking-tight">{setting.name}</h4>
                      <p className="text-xs font-bold text-text-muted mt-1 uppercase tracking-wide">{setting.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {setting.status && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted bg-surface-hover px-3 py-1 rounded-full border border-border">
                        {setting.status}
                      </span>
                    )}
                    {setting.toggle ? (
                      <div 
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${notifications ? 'bg-primary' : 'bg-border'}`}
                        onClick={(e) => { e.stopPropagation(); setNotifications(!notifications); }}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${notifications ? 'left-7' : 'left-1'}`} />
                      </div>
                    ) : (
                      <FaChevronRight className="text-text-muted group-hover:translate-x-1 transition-transform" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-10 border-t border-border mt-10">
        <Button variant="outline-danger" className="rounded-xl font-black uppercase tracking-widest text-xs h-12 px-10">
          Deactivate Account
        </Button>
      </div>
    </div>
  );
}
