// src/pages/tickets/TicketDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, Send, Paperclip, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { tickets, technicians } from '../../mocks/data';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { toast } from '../../hooks';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [assignee, setAssignee] = useState('');

  const ticket = tickets.find(t => t.id === id) || tickets[0];

  const timeline = [
    { type: 'created', time: ticket.createdAt, user: 'System', message: `Ticket ${ticket.ticketId} created`, icon: AlertTriangle, color: 'text-info' },
    { type: 'assigned', time: ticket.assignedAt || ticket.createdAt, user: 'Priya Mehta (Manager)', message: `Assigned to ${ticket.assignedName}`, icon: User, color: 'text-navy' },
    ...(ticket.status !== 'new' ? [{ type: 'update', time: ticket.updatedAt, user: ticket.assignedName, message: 'Status updated to In Progress', icon: Clock, color: 'text-warning' }] : []),
    ...(ticket.status === 'resolved' || ticket.status === 'closed' ? [{ type: 'resolved', time: ticket.resolvedAt || ticket.updatedAt, user: ticket.assignedName, message: 'Issue resolved. Closing ticket.', icon: CheckCircle2, color: 'text-success' }] : []),
  ];

  const handleAddComment = () => {
    if (!comment.trim()) return;
    toast.success('Comment added!');
    setComment('');
  };

  const handleAssign = () => {
    if (!assignee) return;
    toast.success(`Ticket assigned to ${assignee}`);
  };

  const categoryColorMap = {
    inverter_fault: 'bg-danger/10 text-danger',
    module_issue: 'bg-warning/10 text-warning',
    cleaning_request: 'bg-info/10 text-info',
    monitoring_alert: 'bg-purple-100 text-purple-700',
    billing: 'bg-gray-100 text-gray-600',
    general: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/tickets')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-navy">{ticket.ticketId}</h1>
            <Badge status={ticket.status} dot />
            <Badge status={ticket.priority} />
            {ticket.slaStatus === 'breached' && <Badge status="escalated" label="SLA Breached" />}
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{ticket.title}</p>
        </div>
        <div className="flex gap-2">
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <Button variant="success" size="sm" leftIcon={<CheckCircle2 size={14} />} onClick={() => toast.success('Ticket resolved!')}>
              Resolve
            </Button>
          )}
          <Button variant="outline-danger" size="sm" leftIcon={<X size={14} />} onClick={() => toast.info('Ticket closed')}>
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Issue description */}
          <div className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`px-2 py-1 rounded text-xs font-medium ${categoryColorMap[ticket.category] || 'bg-gray-100 text-gray-600'}`}>
                {ticket.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <span className="text-xs text-text-muted">{formatRelativeTime(ticket.createdAt)}</span>
            </div>
            <h2 className="text-base font-bold text-navy mb-3">{ticket.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{ticket.description}</p>

            {ticket.affectedComponents?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-navy mb-2">Affected Components</p>
                <div className="flex flex-wrap gap-2">
                  {ticket.affectedComponents.map(c => (
                    <span key={c} className="text-xs px-2 py-1 bg-warning/10 text-warning-700 rounded font-medium">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-navy mb-4">Timeline</h3>
            <div className="space-y-4">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 ${event.color}`}>
                    <event.icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-navy">{event.message}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{event.user} • {formatRelativeTime(event.time)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="mt-6 pt-4 border-t border-border">
              <label className="form-label">Add Comment / Update</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                className="form-textarea"
                placeholder="Type an update, note, or observation..."
              />
              <div className="flex items-center justify-between mt-2">
                <button className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-navy">
                  <Paperclip size={13} />
                  Attach Photo/File
                </button>
                <Button size="sm" leftIcon={<Send size={13} />} onClick={handleAddComment}>
                  Add Comment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Ticket Details</h3>
            <div className="space-y-2.5">
              {[
                ['Status', <Badge key="s" status={ticket.status} dot size="xs" />],
                ['Priority', <Badge key="p" status={ticket.priority} size="xs" />],
                ['SLA Status', <Badge key="sla" status={ticket.slaStatus === 'breached' ? 'escalated' : ticket.slaStatus === 'at_risk' ? 'expiring' : 'healthy'} label={ticket.slaStatus?.replace('_', ' ')} size="xs" />],
                ['Created', formatDate(ticket.createdAt)],
                ['Updated', formatDate(ticket.updatedAt)],
                ['Source', ticket.source?.replace(/_/g, ' ')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                  <span className="text-xs text-text-secondary">{label}</span>
                  <span className="text-xs font-medium text-navy capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Customer & Site</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted">Customer</p>
                <button onClick={() => navigate(`/customers/${ticket.customerId}`)} className="text-sm font-semibold text-solar hover:underline">
                  {ticket.customerName}
                </button>
              </div>
              <div>
                <p className="text-xs text-text-muted">Solar Site</p>
                <button onClick={() => navigate(`/sites/${ticket.siteId}`)} className="text-sm font-semibold text-solar hover:underline">
                  {ticket.siteName}
                </button>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Assigned Technician</h3>
            {ticket.assignedName ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold">
                    {ticket.assignedName.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy">{ticket.assignedName}</p>
                    <p className="text-xs text-text-secondary">{ticket.technicianId ? 'Field Technician' : 'Senior Technician'}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" fullWidth onClick={() => toast.info('Reassignment dialog...')}>
                  Reassign
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <select className="form-select" value={assignee} onChange={e => setAssignee(e.target.value)}>
                  <option value="">Select Technician</option>
                  {technicians.filter(t => t.status === 'available').map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <Button size="sm" fullWidth onClick={handleAssign}>Assign</Button>
              </div>
            )}
          </div>

          {ticket.estimatedResolutionTime && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-navy mb-2 flex items-center gap-2">
                <Clock size={13} className="text-text-muted" /> SLA Deadline
              </h3>
              <p className="text-sm font-semibold text-warning-700">{formatDate(ticket.estimatedResolutionTime)}</p>
              <p className="text-xs text-text-muted mt-0.5">Response SLA target</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
