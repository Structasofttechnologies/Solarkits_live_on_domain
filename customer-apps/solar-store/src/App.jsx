import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Provider, useDispatch, useSelector } from "react-redux"
import store from "./app/store"
import Alert from "./Components/Alert"
import AuthDialog from "./Components/AuthDialog"
import { useEffect } from "react"
import { checkAuth } from "./features/auth.slice"
import { fetchCart } from "./features/slice"

// Landing page (solar-store's own landing)
import LandingPage from "./Pages/LandingPage.jsx"
import ShopPage from "./Pages/ShopPage.jsx"

// Auth pages
import Login from "./Pages/Login"
import SignUp from "./Pages/SignUp"
import ForgotPassword from "./Pages/ForgotPassword"

// Protected store board
import Board from "./Pages/Board"

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth_slice);

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
        {/* Public landing and shop pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/shop" element={<ShopPage />} />

        {/* Auth routes */}
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />

        {/* Protected store dashboard (Board handles all store routes) */}
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
