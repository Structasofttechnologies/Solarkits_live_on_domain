import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { FiMail, FiLock, FiLoader, FiZap, FiKey } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        navigate("/dashboard");
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
    setPassword("structasoftadmin@gmail.com");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-300 rounded-3xl p-8 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <FiZap size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reseller Business Portal</h1>
          <p className="text-sm text-slate-600">Sign in to manage your solar business, EPC sub-accounts & wallet</p>
        </div>

        {/* Demo Credentials Card */}
        <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <FiKey size={14} className="text-blue-600" /> Demo Reseller Credentials
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-black uppercase">Active Demo</span>
          </div>
          <div className="text-xs font-mono bg-white p-2.5 rounded-xl border border-blue-200 space-y-1 text-slate-800">
            <div><span className="font-bold text-slate-500 font-sans">Email:</span> structasoftadmin@gmail.com</div>
            <div><span className="font-bold text-slate-500 font-sans">Pass:</span> structasoftadmin@gmail.com</div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ⚡ Click to Auto-Fill Demo Credentials
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-100 text-red-700 text-xs font-semibold border border-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Business Email / Mobile</label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                required
                placeholder="reseller@example.com or mobile"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <FiLoader className="animate-spin" size={18} /> : "Sign In to Portal"}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-600 font-medium">
          Don't have a Reseller Business Account?{" "}
          <Link to="/register" className="text-blue-600 font-bold hover:underline underline-offset-2">
            Apply Now
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
