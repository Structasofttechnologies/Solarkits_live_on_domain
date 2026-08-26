import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';

export default function BdeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Notifications & Announcements</h1>
        <p className="text-xs text-slate-500">
          Stay updated with territory reallocations, target achievements, and administrative updates.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
            <p className="text-xs text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n._id}
              className={`p-5 flex items-start gap-4 transition ${
                n.is_read ? 'bg-white' : 'bg-blue-50/40'
              }`}
            >
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n._id)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shrink-0 transition"
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
