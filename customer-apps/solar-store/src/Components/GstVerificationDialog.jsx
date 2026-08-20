import React, { useState } from "react";
import axios from "axios";
import { FiLock, FiCheckCircle, FiAlertTriangle, FiArrowLeft, FiClock, FiKey } from "react-icons/fi";
import Dialog from "./Dialog";
import Button from "./Button";
import CustomInput from "./CustomInput";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function GstVerificationDialog({ isOpen, onClose, stateId, onVerified }) {
  const [step, setStep] = useState(1); // 1: Input GSTIN, 2: OTP, 3: Success
  const [gstin, setGstin] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [companyDetails, setCompanyDetails] = useState(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const formatted = gstin.trim().toUpperCase();
    if (formatted.length !== 15) {
      setErrorMsg("GSTIN must be exactly 15 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/india/v1/shop/gst/generate-otp`,
        { gstin: formatted },
        { withCredentials: true }
      );

      if (response.data?.success) {
        setRequestId(response.data.request_id);
        setStep(2);
      } else {
        setErrorMsg(response.data?.message || "Failed to generate OTP.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to send OTP. Please check the GSTIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!otp || otp.length < 4) {
      setErrorMsg("Please enter a valid OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/india/v1/shop/gst/verify-otp`,
        {
          request_id: requestId,
          otp: otp.trim(),
          gstin: gstin.trim().toUpperCase(),
          state_id: stateId
        },
        { withCredentials: true }
      );

      if (response.data?.success) {
        setCompanyDetails(response.data.data);
        setStep(3);
        if (onVerified) {
          onVerified(response.data.data);
        }
      } else {
        setErrorMsg(response.data?.message || "Verification failed.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setGstin("");
    setOtp("");
    setRequestId("");
    setErrorMsg("");
    setCompanyDetails(null);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="GST Tax Compliance Verification"
      size="sm"
    >
      <div className="py-2">
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm font-semibold flex items-center gap-2">
            <FiAlertTriangle className="shrink-0" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <FiLock size={28} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Verify Your GSTIN</h3>
              <p className="text-text-secondary text-sm">
                Enter your 15-digit GSTIN to receive an OTP on your GST-registered mobile number and email.
              </p>
            </div>

            <CustomInput
              name="gstin"
              label="GSTIN Number *"
              placeholder="e.g. 24AAAEE1234A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              maxLength={15}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              className="py-3 bg-gradient-to-r from-primary to-primary-end font-bold rounded-xl"
            >
              {loading ? "Sending OTP..." : "Verify GST & Send OTP"}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-3">
                <FiKey size={28} />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Enter Verification Code</h3>
              <p className="text-text-secondary text-sm">
                An OTP has been sent to the contacts registered with GSTIN <span className="font-semibold">{gstin}</span>.
              </p>
            </div>

            <CustomInput
              name="otp"
              label="OTP Code *"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={loading}
                leftIcon={<FiArrowLeft />}
                className="flex-1 border border-border"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-primary-end font-bold rounded-xl"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-primary hover:text-primary-end text-xs font-semibold"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <FiCheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">GST Verification Successful!</h3>
            <p className="text-text-secondary text-sm">
              Your business and tax credentials have been verified successfully.
            </p>

            {companyDetails && (
              <div className="bg-surface-hover border border-border rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Legal Name:</span>
                  <span className="font-bold text-text-primary">{companyDetails.legal_name}</span>
                </div>
                {companyDetails.trade_name && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Brand/Trade Name:</span>
                    <span className="font-bold text-text-primary">{companyDetails.trade_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">GST Number:</span>
                  <span className="font-mono font-bold text-text-primary">{companyDetails.gst_number}</span>
                </div>
              </div>
            )}

            <Button
              onClick={onClose}
              variant="primary"
              fullWidth
              className="py-3 bg-gradient-to-r from-primary to-primary-end font-bold rounded-xl"
            >
              Continue to Place Order
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
