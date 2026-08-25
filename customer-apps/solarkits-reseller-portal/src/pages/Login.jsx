import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { FiMail, FiLock, FiLoader, FiKey, FiEye, FiEyeOff } from "react-icons/fi";
import logoImg from "@/assets/images/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("reseller_token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post('/india/v1/reseller/auth/login', {
        email_or_mobile: email.trim(),
        password: password.trim(),
      });

      if (res.data?.status === "success") {
        const token = res.data.token || res.data.data?.token;
        const reseller = res.data.user || res.data.data?.reseller;
        localStorage.setItem("reseller_token", token);
        localStorage.setItem("reseller_user", JSON.stringify(reseller));
        if (reseller?.activation_status === "active") {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      } else {
        setError(res.data?.message || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials or account inactive");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("structasoftadmin@gmail.com");
    setPassword("Password@123");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)",
      }}
    >
      {/* Background decorative blobs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #1a3b8b40, transparent)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #2d55bd40, transparent)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md rounded-3xl p-8 space-y-6 relative z-10"
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 40px rgba(26, 59, 139, 0.12)",
        }}
      >
        {/* Logo & Heading */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img src={logoImg} alt="SolarKits" className="h-12 w-auto" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#0f172a" }}>
              Franchisee Business Portal
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Sign in to manage your solar business, EPC sub-accounts &amp; wallet
            </p>
          </div>
        </div>

        {/* Demo Credentials Card */}
        <div
          className="p-4 rounded-2xl space-y-2.5"
          style={{
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border: "2px solid #bfdbfe",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: "#1d4ed8" }}
            >
              <FiKey size={13} style={{ color: "#3b82f6" }} />
              Demo Franchisee Credentials
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
              style={{ background: "#bfdbfe", color: "#1e40af" }}
            >
              Active Demo
            </span>
          </div>
          <div
            className="text-xs font-mono p-2.5 rounded-xl border space-y-1"
            style={{ background: "white", borderColor: "#bfdbfe", color: "#334155" }}
          >
            <div>
              <span className="font-bold font-sans" style={{ color: "#94a3b8" }}>Email: </span>
              structasoftadmin@gmail.com
            </div>
            <div>
              <span className="font-bold font-sans" style={{ color: "#94a3b8" }}>Pass: </span>
              Password@123
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #1a3b8b 0%, #2d55bd 100%)",
            }}
          >
            ⚡ Click to Auto-Fill Demo Credentials
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3.5 rounded-xl text-xs font-semibold"
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: "#334155" }}
            >
              Business Email / Mobile
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                size={15}
                style={{ color: "#94a3b8" }}
              />
              <input
                type="text"
                required
                placeholder="franchisee@example.com or mobile"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  color: "#0f172a",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1a3b8b";
                  e.target.style.boxShadow = "0 0 0 3px rgba(26,59,139,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: "#334155" }}
            >
              Password
            </label>
            <div className="relative">
              <FiLock
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                size={15}
                style={{ color: "#94a3b8" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  color: "#0f172a",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#1a3b8b";
                  e.target.style.boxShadow = "0 0 0 3px rgba(26,59,139,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "#94a3b8" }}
              >
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            style={{
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #1a3b8b 0%, #2d55bd 100%)",
              boxShadow: loading ? "none" : "0 4px 16px rgba(26, 59, 139, 0.35)",
            }}
          >
            {loading ? <FiLoader className="animate-spin" size={18} /> : "Sign In to Portal"}
          </button>
        </form>

        <div className="text-center pt-1 text-xs font-medium" style={{ color: "#64748b" }}>
          Don't have a Franchisee Business Account?{" "}
          <Link
            to="/register"
            className="font-bold hover:underline underline-offset-2"
            style={{ color: "#1a3b8b" }}
          >
            Apply Now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
