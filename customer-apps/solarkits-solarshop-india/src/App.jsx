import { BrowserRouter, Route, Routes, useLocation, useNavigate, Navigate } from "react-router-dom"
import './App.css'
import Board from "./pages/Board"
import Login from "./pages/Login";
import { Provider, useDispatch, useSelector } from "react-redux"
import store from "./app/store";
import Alert from "./components/Alert";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/policies/PrivacyPolicy";
import TermsOfService from "./pages/policies/TermsOfService";
import RefundPolicy from "./pages/policies/RefundPolicy";
import ShippingPolicy from "./pages/policies/ShippingPolicy";
import { useEffect } from "react";
import { checkAuth } from "./features/auth.slice";
import { fetchCart } from "./features/slice";
import AuthDialog from "./components/AuthDialog";

function AppContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector(state => state.auth_slice);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <>
      <Alert />
      <AuthDialog />
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Legal & Policy Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />

        {/* Auth routes */}
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />

        {/* Protected dashboard routes */}
        <Route path="/*" element={<Board />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  )
}

export default App
