// src/components/common/Drawer.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
};

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
  side = 'right',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{ backgroundColor: 'rgba(16, 42, 67, 0.45)' }}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        className={[
          'fixed top-0 bottom-0 z-50 flex flex-col bg-white shadow-modal transition-transform duration-300 ease-out',
          side === 'right' ? 'right-0' : 'left-0',
          'w-full',
          sizeClasses[size] || sizeClasses.md,
          isOpen
            ? 'translate-x-0'
            : side === 'right' ? 'translate-x-full' : '-translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0">
          <div>
            {title && <h2 className="text-base sm:text-lg font-semibold text-navy">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 text-text-secondary hover:text-navy transition-colors ml-4 mt-0.5 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-border shrink-0 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
