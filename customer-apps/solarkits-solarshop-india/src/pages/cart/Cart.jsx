import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef, useCallback } from "react";
import PreConfiguredKitOrderCart from "./PreConfiguredKitOrderCart";
import { FiShoppingCart, FiClock, FiAlertTriangle, FiX, FiShield, FiCheckCircle } from "react-icons/fi";
import { selectCartTotalItems, selectCartExpiryTime, clearCart, fetchCart } from "@/features/slice";

// ── Compact helper: format seconds → MM:SS ────────────────────────
const formatCountdown = (seconds) => {
  if (seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function Cart() {
  const dispatch = useDispatch();
  const totalItems = useSelector(selectCartTotalItems);
  const cartExpiryTime = useSelector(selectCartExpiryTime);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [expiredToast, setExpiredToast] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Compute seconds left whenever expiry changes
  const computeSeconds = useCallback(() => {
    if (!cartExpiryTime) return null;
    const diff = Math.floor((new Date(cartExpiryTime).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [cartExpiryTime]);

  useEffect(() => {
    if (!cartExpiryTime) {
      setSecondsLeft(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setSecondsLeft(computeSeconds());
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const remaining = computeSeconds();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        dispatch(clearCart());
        dispatch(fetchCart());
        setExpiredToast(true);
        setTimeout(() => setExpiredToast(false), 7000);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cartExpiryTime, computeSeconds, dispatch]);

  const isUrgent = secondsLeft !== null && secondsLeft <= 120;
  const isCritical = secondsLeft !== null && secondsLeft <= 60;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-16">
      
      {/* Expiry Toast */}
      {expiredToast && (
        <div
          style={{
            position: "fixed",
            top: "1.25rem",
            right: "1.25rem",
            zIndex: 9999,
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            color: "#fff",
            borderRadius: "0.875rem",
            padding: "0.875rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 8px 32px rgba(239,68,68,0.35)",
            maxWidth: "360px",
            animation: "slideInRight 0.35s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", margin: 0 }}>
              Reservation Expired
            </p>
            <p style={{ fontSize: "0.75rem", margin: "0.15rem 0 0", opacity: 0.9 }}>
              Your solar panel reservation has expired and your cart has been cleared.
            </p>
          </div>
          <button
            onClick={() => setExpiredToast(false)}
            style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", marginLeft: "auto", padding: "0.25rem" }}
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* ── Compact Reservation Countdown Banner ──────────────────── */}
      {secondsLeft !== null && totalItems > 0 && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all shadow-xs ${
            isCritical
              ? "bg-red-50/90 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200"
              : isUrgent
              ? "bg-amber-50/90 border-amber-300 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200"
              : "bg-emerald-50/90 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-white/80 dark:bg-black/20 shrink-0">
              <FiClock
                size={16}
                className={isCritical ? "text-red-600 animate-pulse" : isUrgent ? "text-amber-600" : "text-emerald-600"}
              />
            </div>
            <div className="truncate">
              <span className="font-bold">
                {isCritical
                  ? "Reservation expiring very soon!"
                  : isUrgent
                  ? "Inventory reservation expiring soon"
                  : "Solar panel inventory reserved for your session"}
              </span>
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400 text-[11px] ml-2">
                Secure your batch before stock is released.
              </span>
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs tracking-wider text-white shrink-0 ${
              isCritical ? "bg-red-600 animate-pulse" : isUrgent ? "bg-amber-600" : "bg-emerald-600"
            }`}
          >
            {formatCountdown(secondsLeft)}
          </div>
        </div>
      )}

      {/* Cart Content */}
      <PreConfiguredKitOrderCart />

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}