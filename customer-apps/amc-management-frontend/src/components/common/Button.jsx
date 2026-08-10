// src/components/common/Button.jsx
import { forwardRef } from 'react';

const sizeClasses = {
  xs: 'h-6 px-2.5 text-xs',
  sm: 'h-7 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  xl: 'h-12 px-8 text-lg',
};

const variantClasses = {
  primary: 'bg-solar text-white hover:bg-solar-dark active:bg-solar-dark/90 shadow-sm',
  secondary: 'bg-navy text-white hover:bg-navy-light active:bg-navy-dark shadow-sm',
  outline: 'bg-white text-navy border border-border hover:border-navy/30 hover:bg-gray-50',
  ghost: 'bg-transparent text-text-secondary hover:bg-gray-100 hover:text-navy',
  danger: 'bg-danger text-white hover:bg-danger-600 active:bg-danger-700 shadow-sm',
  success: 'bg-success text-white hover:bg-success-600 shadow-sm',
  warning: 'bg-warning text-white hover:bg-warning-600 shadow-sm',
  info: 'bg-info text-white hover:bg-info-600 shadow-sm',
  'outline-danger': 'bg-white text-danger border border-danger/30 hover:bg-danger/5',
  'outline-primary': 'bg-white text-solar border border-solar/40 hover:bg-solar/5',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/40',
        sizeClasses[size] || sizeClasses.md,
        variantClasses[variant] || variantClasses.primary,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
