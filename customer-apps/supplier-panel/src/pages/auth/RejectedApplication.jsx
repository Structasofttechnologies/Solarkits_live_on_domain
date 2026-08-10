import React from "react";
import { FiXCircle, FiInfo } from "react-icons/fi";
import { HiSun, HiMoon } from "react-icons/hi2";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout_user } from "@/features/auth.slice";
import useTheme from "@/hooks/useTheme";

export default function RejectedApplication() {
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { supplier } = useSelector((state) => state.auth_slice);

  const handleSignOut = () => {
    dispatch(logout_user());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-2.5 rounded-2xl bg-surface/80 backdrop-blur-sm border border-border/50 text-text-secondary hover:text-primary hover:border-primary/30 transition-all duration-300 shadow-sm cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
      </button>

      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-danger/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-danger/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="card shadow-2xl bg-surface/80 backdrop-blur-xl border border-border rounded-[2rem] overflow-hidden p-8 md:p-12 text-center relative">
          
          <div className="w-24 h-24 mx-auto mb-8 relative">
             <div className="absolute inset-0 rounded-full border-4 border-danger/20 overflow-hidden">
                <div className="w-full h-full bg-danger/10 absolute" />
             </div>
             <div className="relative w-full h-full bg-linear-to-br from-danger to-danger/90 rounded-full flex items-center justify-center shadow-lg shadow-danger/30 z-10">
              <FiXCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-4 tracking-tight">
            Application Not Approved
          </h1>
          
          <p className="text-text-secondary text-base md:text-lg mb-8 leading-relaxed font-medium">
            Unfortunately, your supplier application was not approved by our verification administrators.
          </p>

          {supplier?.rejection_reason && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-6 shadow-sm mb-8 text-left">
              <h4 className="font-bold text-danger text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                <FiInfo /> Reason for Rejection
              </h4>
              <p className="text-sm text-text-primary font-medium leading-relaxed">
                "{supplier.rejection_reason}"
              </p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs text-text-muted font-bold leading-relaxed">
              If you have any questions or would like to appeal this decision, please reach out to our team at <a href="mailto:support@emergesun.com" className="text-primary hover:underline font-black">support@emergesun.com</a>.
            </p>
            
            <div>
              <button
                onClick={handleSignOut}
                className="text-xs font-black text-primary hover:underline uppercase tracking-widest cursor-pointer bg-transparent border-none mt-4 outline-none"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
