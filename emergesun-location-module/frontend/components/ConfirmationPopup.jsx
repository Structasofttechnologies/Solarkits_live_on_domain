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

  const variantConfig = {
    warning: {
      icon: FaExclamationTriangle,
      buttonVariant: "warning",
      border: "border-warning/30",
    },
    danger: {
      icon: FaExclamationTriangle,
      buttonVariant: "danger",
      border: "border-danger/30",
    },
    success: {
      icon: FaCheck,
      buttonVariant: "success",
      border: "border-success/30",
    },
    info: {
      icon: FaShieldAlt,
      buttonVariant: "primary",
      border: "border-primary/30",
    },
    secure: {
      icon: FaLock,
      buttonVariant: "primary",
      border: "border-primary/30",
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border ${config.border} bg-white shadow-2xl animate-in zoom-in-95 duration-300`}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="relative pt-8 pb-5 px-6 flex flex-col items-center text-center">
          {showIcon && (
            <div className="relative mb-4">
              <div className={`relative w-16 h-16 rounded-2xl bg-primary/10 border ${config.border} shadow-lg flex items-center justify-center`}>
                <config.icon className="text-3xl text-primary" />
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-900 uppercase mb-1.5">
            {title}
          </h2>
          <p className="text-sm text-gray-600 font-medium leading-relaxed px-2">
            {message}
          </p>

          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="text-gray-400" />
          </IconButton>
        </div>

        <div className="relative p-6 pt-1 bg-gray-50/50">
          {mode === "custom" && (
            <div className="mb-6 p-4 rounded-xl bg-white border border-gray-200">
              {customContent}
            </div>
          )}

          {mode === "otp" && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-5 justify-center">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FaLock size={12} />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{otpMessage}</p>
              </div>
              
              <div className="flex justify-center mb-5">
                <OTPInput
                  length={otpLength}
                  onChange={handleOTPChange}
                />
              </div>
              
              {otpError && (
                <div className="flex items-center gap-2 justify-center py-2 px-3 rounded-lg bg-red-100 text-red-600">
                  <FaExclamationTriangle size={12} />
                  <p className="text-xs font-bold uppercase">{otpError}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              variant="secondary"
              size="md"
              fullWidth
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
              {...confirmButtonProps}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
