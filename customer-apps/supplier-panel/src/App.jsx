import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import './App.css';
import Alert from "./components/Alert";
import Loader from "./components/Loader";
import ProtectedRoutes from "./components/ProtectedRoutes";
import PublicRoutes from "./components/PublicRoutes";

const Dashboard     = lazy(() => import("./dashboard/Dashboard"));
const Login         = lazy(() => import("./pages/auth/Login"));
const Register      = lazy(() => import("./pages/auth/Register"));
const ForgotPassword= lazy(() => import("./pages/auth/ForgotPassword"));
const OtpVerification=lazy(() => import("./pages/auth/OtpVerification"));
const SetPasscode   = lazy(() => import("./pages/auth/SetPasscode"));
const NotFound      = lazy(() => import("./pages/NotFound"));
const PendingReview = lazy(() => import("./pages/auth/PendingReview"));
const RejectedApplication = lazy(() => import("./pages/auth/RejectedApplication"));
const ActivateAccount = lazy(() => import("./pages/auth/ActivateAccount"));
const ChooseAccount = lazy(() => import("./pages/auth/ChooseAccount"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<PublicRoutes />}>
          <Route path="/login"              element={<Suspense fallback={<Loader />}><Login /></Suspense>} />
          <Route path="/auth/login"         element={<Suspense fallback={<Loader />}><Login /></Suspense>} />
          <Route path="/auth/register"      element={<Suspense fallback={<Loader />}><Register /></Suspense>} />
          <Route path="/auth/forgot-password" element={<Suspense fallback={<Loader />}><ForgotPassword /></Suspense>} />
          <Route path="/auth/otp-verify"    element={<Suspense fallback={<Loader />}><OtpVerification /></Suspense>} />
          <Route path="/auth/set-passcode"  element={<Suspense fallback={<Loader />}><SetPasscode /></Suspense>} />
          <Route path="/auth/activate-account" element={<Suspense fallback={<Loader />}><ActivateAccount /></Suspense>} />
          <Route path="/auth/choose-account" element={<Suspense fallback={<Loader />}><ChooseAccount /></Suspense>} />
        </Route>

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard/pending"  element={<Suspense fallback={<Loader />}><PendingReview /></Suspense>} />
          <Route path="/dashboard/rejected" element={<Suspense fallback={<Loader />}><RejectedApplication /></Suspense>} />
          <Route path="/dashboard/*"        element={<Suspense fallback={<Loader />}><Dashboard /></Suspense>} />
        </Route>

        {/* Redirects & Fallbacks */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Suspense fallback={<Loader />}><NotFound /></Suspense>} />
      </Routes>
      <Alert />
    </BrowserRouter>
  )
}
