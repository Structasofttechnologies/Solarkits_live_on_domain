// src/components/common/ConfirmDialog.jsx
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Trash2, AlertCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const iconMap = {
    danger: <Trash2 size={20} className="text-danger" />,
    warning: <AlertTriangle size={20} className="text-warning" />,
    info: <AlertCircle size={20} className="text-info" />,
  };

  const bgMap = {
    danger: 'bg-danger-50',
    warning: 'bg-warning-50',
    info: 'bg-info-50',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant === 'info' ? 'secondary' : 'danger'} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        <div className={`p-2 rounded-lg shrink-0 ${bgMap[variant] || bgMap.danger}`}>
          {iconMap[variant] || iconMap.danger}
        </div>
        <div>
          <h3 className="text-base font-semibold text-navy">{title}</h3>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
