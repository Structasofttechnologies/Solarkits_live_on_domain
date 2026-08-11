import Tooltip from "./Tooltip";

const IconButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  tooltip = '',
  ...props
}) => {
  const baseStyles = 'transition-all duration-300 flex items-center justify-center cursor-pointer focus-ring shrink-0';

  const sizeStyles = {
    sm: 'p-2 text-sm rounded-lg',
    md: 'p-3 text-base rounded-xl',
    lg: 'p-4 text-lg rounded-2xl',
  };
  
  const variantStyles = {
    primary: 'bg-primary text-white shadow-md hover:opacity-90',
    secondary: 'bg-surface-hover text-text-primary shadow-sm hover:bg-surface',
    warning: 'bg-amber-500 text-white shadow-md hover:bg-amber-600',
    'outline-primary': 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10',
    'outline-secondary': 'bg-transparent border-2 border-border text-text-primary hover:bg-surface-hover',
    ghost: 'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-primary',
    danger: 'bg-red-600 text-white shadow-md hover:bg-red-700',
    success: 'bg-green-600 text-white shadow-md hover:bg-green-700',
  };

  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none';

  const button = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${disabledStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip text={tooltip}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default IconButton;
