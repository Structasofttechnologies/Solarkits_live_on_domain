import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Filter } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { notifications as mockNotifs } from '../../mocks/index';
import toast from 'react-hot-toast';

const TYPE_LABELS = {
  user_created: { label: 'User Created', color: 'bg-green-100 text-green-700', emoji: '👤' },
  user_suspended: { label: 'User Suspended', color: 'bg-red-100 text-red-700', emoji: '🚫' },
  subscription_expiring: { label: 'Subscription', color: 'bg-amber-100 text-amber-700', emoji: '⚠️' },
  country_admin_assigned: { label: 'Country Admin', color: 'bg-blue-100 text-blue-700', emoji: '🌍' },
  role_updated: { label: 'Role Updated', color: 'bg-purple-100 text-purple-700', emoji: '🛡️' },
  password_reset: { label: 'Password Reset', color: 'bg-gray-100 text-gray-600', emoji: '🔑' },
  product_access: { label: 'Product Access', color: 'bg-indigo-100 text-indigo-700', emoji: '📦' },
  new_login: { label: 'New Login', color: 'bg-teal-100 text-teal-700', emoji: '💻' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(mockNotifs);
  const [filter, setFilter] = useState('all');

  const markRead = (id) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAll = () => { setNotifs((prev) => prev.map((n) => ({ ...n, read: true }))); toast.success('All notifications marked as read'); };

  const filtered = notifs.filter((n) => filter === 'all' ? true : filter === 'unread' ? !n.read : n.type === filter);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: 'Notifications' }]} />
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-solar-navy">Notifications</h1>
          <p className="text-solar-slate text-sm mt-0.5">{unread} unread notifications</p>
        </div>
        <button onClick={markAll} className="btn-outline btn-sm"><CheckCheck size={14} /> Mark all read</button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: `Unread (${unread})` },
          { value: 'user_created', label: 'Users' },
          { value: 'subscription_expiring', label: 'Subscriptions' },
          { value: 'role_updated', label: 'Roles' },
          { value: 'product_access', label: 'Products' },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${filter === f.value ? 'bg-primary text-white border-primary' : 'bg-white text-solar-slate border-solar-border hover:border-primary hover:text-primary'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-solar-navy">No notifications</h3>
            <p className="text-solar-slate text-sm">You're all caught up!</p>
          </div>
        ) : filtered.map((n) => {
          const cfg = TYPE_LABELS[n.type] || { label: n.type, color: 'bg-gray-100 text-gray-600', emoji: '🔔' };
          return (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`card p-4 cursor-pointer transition-all card-hover ${!n.read ? 'border-l-4 border-l-primary bg-blue-50/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{cfg.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-solar-navy text-sm">{n.title}</span>
                    <span className={`badge text-xs ${cfg.color}`}>{cfg.label}</span>
                    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                  <p className="text-sm text-solar-slate">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                </div>
                {!n.read && (
                  <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                    className="btn-ghost btn-sm text-xs flex-shrink-0" title="Mark read">
                    <Check size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
