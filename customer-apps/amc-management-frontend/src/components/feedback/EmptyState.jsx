// src/components/feedback/EmptyState.jsx
import Button from '../common/Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon size={24} className="text-text-muted" />
        </div>
      )}
      <h3 className="text-base font-semibold text-navy mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}
      <div className="flex items-center gap-3">
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
