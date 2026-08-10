// src/components/common/Toast.jsx
import { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useToast } from '../../hooks';

const config = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-white border-l-4 border-success',
    iconColor: 'text-success',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    bg: 'bg-white border-l-4 border-danger',
    iconColor: 'text-danger',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-white border-l-4 border-warning',
    iconColor: 'text-warning',
    title: 'Warning',
  },
  info: {
    icon: Info,
    bg: 'bg-white border-l-4 border-info',
    iconColor: 'text-info',
    title: 'Info',
  },
};

function ToastItem({ toast, onRemove }) {
  const c = config[toast.type] || config.info;
  const Icon = c.icon;

  useEffect(() => {
    if (toast.duration > 0) {
      const t = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(t);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={[
      'flex items-start gap-3 p-4 rounded-lg shadow-card-md w-80 animate-slide-up',
      c.bg,
    ].join(' ')}>
      <Icon size={20} className={`${c.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy">{c.title}</p>
        <p className="text-sm text-text-secondary mt-0.5 break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-0.5 rounded hover:bg-gray-100 text-text-muted hover:text-text-secondary shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}
