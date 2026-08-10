import { useState, useRef } from "react";
import { 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle,
  FaShieldAlt,
  FaLock
} from "react-icons/fa";
import OTPInput from "./OTPInput";
import Button from "./Button";
import IconButton from "./IconButton";

export default function ConfirmationPopup({
  isOpen,
  title,
  message,
  mode = "text",
  otpLength = 6,
  onConfirm,
  onCancel,
  onClose,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "info",
  otpMessage = "Enter OTP sent to your registered contact",
  showIcon = true,
  customContent = null,
  confirmButtonProps = {},
  cancelButtonProps = {}
}) {
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const mouseDownOnBackdrop = useRef(false);

  if (!isOpen) return null;

  // Variant-specific configurations using theme variables
  const variantConfig = {
    warning: {
      bg: "gradient-warning-soft",
      iconBg: "bg-warning/20",
      iconColor: "text-warning",
      icon: FaExclamationTriangle,
      buttonVariant: "warning",
      iconButtonVariant: "warning",
      border: "border-warning/20",
      textColor: "text-warning",
    },
    danger: {
      bg: "gradient-danger-soft",
      iconBg: "bg-danger/20",
      iconColor: "text-danger",
      icon: FaExclamationTriangle,
      buttonVariant: "danger",
      iconButtonVariant: "danger",
      border: "border-danger/20",
      textColor: "text-danger",
    },
    success: {
      bg: "gradient-success-soft",
      iconBg: "bg-success/20",
      iconColor: "text-success",
      icon: FaCheck,
      buttonVariant: "success",
      iconButtonVariant: "success",
      border: "border-success/20",
      textColor: "text-success",
    },
    info: {
      bg: "gradient-primary-soft",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      icon: FaShieldAlt,
      buttonVariant: "primary",
      iconButtonVariant: "primary",
      border: "border-primary/20",
      textColor: "text-primary",
    },
    secure: {
      bg: "gradient-primary-soft",
      iconBg: "gradient-primary",
      iconColor: "text-text-inverse",
      icon: FaLock,
      buttonVariant: "primary",
      iconButtonVariant: "primary",
      border: "border-primary/30",
      textColor: "text-primary",
    }
  };

  const config = variantConfig[variant] || variantConfig.info;

  const handleOTPChange = (value) => {
    setOtp(value);
    setOtpError("");
  };

  const handleConfirm = () => {
    if (mode === "otp") {
      if (otp.length !== otpLength) {
        setOtpError(`OTP must be ${otpLength} digits`);
        return;
      }
      onConfirm?.(otp);
      setOtp("");
      setOtpError("");
    } else {
      onConfirm?.();
    }
  };

  const handleCancel = () => {
    setOtp("");
    setOtpError("");
    onCancel?.();
    onClose?.();
  };

  // Backdrop close: only fire when both mousedown AND mouseup land on backdrop
  const handleBackdropMouseDown = (e) => {
    mouseDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropMouseUp = (e) => {
    if (mouseDownOnBackdrop.current && e.target === e.currentTarget) {
      handleCancel();
    }
    mouseDownOnBackdrop.current = false;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        className={`card-glass rounded-2xl shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-300 overflow-hidden ${config.border} max-h-[calc(100vh-100px)]! overflow-y-auto`}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        
        {/* Header with gradient */}
        <div className="gradient-bg-subtle border-b border-border p-6 space-y-6">
          <div className="flex items-center gap-4">
            {showIcon && (
              <div className={`p-3 rounded-xl ${config.iconBg} shadow-sm`}>
                <config.icon className={`text-2xl ${config.iconColor}`} />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <p className="text-sm text-text-secondary mt-1">{message}</p>
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className="hover:bg-surface-hover"
            >
              <FaTimes className="text-text-secondary" />
            </IconButton>
          </div>
          {mode === "custom" && customContent}
        </div>

        {/* Content Area */}
        <div className="p-6">

          {/* OTP Input Section */}
          {mode === "otp" && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FaLock className="text-primary" />
                </div>
                <p className="text-sm text-text-secondary">{otpMessage}</p>
              </div>
              
              <div className="flex justify-center mb-4">
                <OTPInput
                  length={otpLength}
                  onChange={handleOTPChange}
                  className="bg-surface-hover border-border"
                />
              </div>
              
              {otpError && (
                <div className="flex items-center gap-2 justify-center mb-3">
                  <FaExclamationTriangle className="text-danger text-sm" />
                  <p className="text-sm text-danger">{otpError}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<FaTimes />}
              className="border-border hover:border-border/80"
              {...cancelButtonProps}
            >
              {cancelText}
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={isLoading || (mode === "otp" && otp.length !== otpLength)}
              variant={config.buttonVariant}
              size="md"
              fullWidth
              loading={isLoading}
              leftIcon={isLoading ? undefined : <FaCheck />}
              className="shadow-md hover:shadow-lg transition-all"
              {...confirmButtonProps}
            >
              {isLoading ? "Processing..." : confirmText}
            </Button>
          </div>

          {/* Security Note for OTP mode */}
          {mode === "otp" && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <FaShieldAlt className="text-primary" />
                <span>Your security is our priority. OTP expires in 5 minutes.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}