// src/pages/notifications/NotificationsPage.jsx
import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X, Trash2, Filter } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { notifications as initialNotifications } from '../../mocks/data';
import { formatRelativeTime } from '../../utils/formatters';
import { toast } from '../../hooks';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');

  const filteredNotifs = notifs.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'critical') return n.priority === 'critical' || n.priority === 'high';
    return true;
  });

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const markAsRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotif = (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    toast.info('Notification removed');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-l-danger bg-danger-50/30';
      case 'high': return 'border-l-warning bg-warning-50/30';
      case 'medium': return 'border-l-info bg-info-50/30';
      default: return 'border-l-gray-300 bg-white';
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={22} className="text-solar" />
            Notifications & System Alerts
          </h1>
          <p className="page-subtitle">Stay updated on solar plant faults, contract renewals, SLA breaches, and service visits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} leftIcon={<CheckCircle2 size={14} />}>
            Mark All Read
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => { setNotifs([]); toast.info('Cleared all notifications'); }} leftIcon={<Trash2 size={14} />}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-3 flex flex-wrap gap-2">
        {[
          { id: 'all', label: `All Notifications (${notifs.length})` },
          { id: 'unread', label: `Unread (${notifs.filter(n => !n.isRead).length})` },
          { id: 'critical', label: `Critical & High (${notifs.filter(n => n.priority === 'critical' || n.priority === 'high').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === tab.id ? 'bg-navy text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.map(n => (
          <div
            key={n.id}
            className={`card border-l-4 p-4 transition-all hover:shadow-card-md flex items-start gap-4 ${getPriorityColor(n.priority)} ${
              !n.isRead ? 'ring-1 ring-solar/20 font-medium' : 'opacity-85'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center shrink-0 shadow-xs">
              {n.priority === 'critical' ? <AlertTriangle size={18} className="text-danger" /> :
               n.priority === 'high' ? <AlertTriangle size={18} className="text-warning" /> :
               <Info size={18} className="text-info" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold text-navy">{n.title}</span>
                <Badge status={n.priority} size="xs" />
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-solar" />}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{n.message}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xxs text-text-muted">{formatRelativeTime(n.createdAt)}</span>
                {n.category && <span className="text-xxs font-mono uppercase bg-gray-100 px-1.5 py-0.5 rounded text-text-muted">{n.category}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!n.isRead && (
                <Button size="xs" variant="ghost" onClick={() => markAsRead(n.id)}>
                  Mark Read
                </Button>
              )}
              <button
                onClick={() => deleteNotif(n.id)}
                className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-gray-100 transition-colors"
                title="Delete notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredNotifs.length === 0 && (
          <div className="card p-12 text-center text-text-muted">
            <Bell size={36} className="mx-auto mb-3 text-text-muted opacity-50" />
            <p className="text-base font-semibold text-navy">No notifications found</p>
            <p className="text-xs text-text-secondary mt-1">You are all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
