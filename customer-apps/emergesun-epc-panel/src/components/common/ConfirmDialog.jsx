import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-solar-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'}`}>
              <AlertTriangle size={18} className={variant === 'danger' ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <h3 className="font-semibold text-solar-navy">{title}</h3>
          </div>
          <button onClick={onCancel} className="btn-icon text-solar-slate"><X size={18} /></button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-solar-slate">{message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-solar-border">
          <button onClick={onCancel} className="btn-outline btn-sm">{cancelLabel}</button>
          <button onClick={onConfirm} className={`btn-sm btn ${variant === 'danger' ? 'btn-danger' : 'btn-secondary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
