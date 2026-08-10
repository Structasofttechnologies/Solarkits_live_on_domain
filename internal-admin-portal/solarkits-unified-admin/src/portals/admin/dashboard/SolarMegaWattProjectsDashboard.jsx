import { useEffect, useState } from "react";
import Drawer from "@/components/Drawer";
import Header from "@/components/Header";
import { FaHome } from "react-icons/fa";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Home from "@/pages/solar-mega-watt-projects/Home";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import { useSelector, useDispatch } from "react-redux";
import { setAlert } from "../features/alert.slice";
import Loader from "@/components/Loader";

const menus = [
  [
    { name: "Dashboard", icon: <FaHome />, path: "/admin-panel/solar-mega-watt-projects/home" },
  ]
];

export default function SolarMegaWattProjectsDashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkProductMarket = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/saas-products/company-products?unique_id=ADM_SAAS_PRODS&req_for=view`,
          { headers: authHeaderObj() }
        );
        if (res.data?.status === "success") {
          const allProducts = res.data.data.products || [];
          const foundProduct = allProducts.find(p => p.slug === "solar-mega-watt-projects");
          const activeOnes = (foundProduct?.countries || []).filter(c => c.is_active);
          
          if (activeOnes.length === 0) {
            dispatch(setAlert({ type: "warning", message: "This product is not active in any country" }));
            navigate('/admin-panel/home', { replace: true });
            return;
          }
          
          // Check if URL has a country (use window.location.pathname for mount-time path)
          const parts = window.location.pathname.split('/');
          const slugIndex = parts.indexOf("solar-mega-watt-projects");
          if (slugIndex !== -1) {
            const nextSegment = parts[slugIndex + 1];
            const activeCountriesNames = activeOnes.map(c => c.name.toLowerCase());
            const hasCountry = nextSegment && activeCountriesNames.includes(nextSegment.toLowerCase());
            
            if (hasCountry) {
              localStorage.setItem('selected_country_admin', nextSegment.toLowerCase());
              const subPathParts = parts.slice(slugIndex + 2);
              const subPath = subPathParts.filter(Boolean).join('/');
              if (!subPath) {
                navigate(`/admin-panel/solar-mega-watt-projects/${nextSegment.toLowerCase()}/home`, { replace: true });
              }
            } else {
              const storedCountry = localStorage.getItem('selected_country_admin');
              const defaultCountry = (storedCountry && activeCountriesNames.includes(storedCountry.toLowerCase())) 
                ? storedCountry.toLowerCase() 
                : activeOnes[0].name.toLowerCase();
              
              const subPathParts = parts.slice(slugIndex + 1);
              let subPath = subPathParts.filter(Boolean).join('/');
              if (!subPath || subPath === 'home') {
                subPath = 'home';
              }
              navigate(`/admin-panel/solar-mega-watt-projects/${defaultCountry}/${subPath}`, { replace: true });
            }
          }
          setLoadingCountries(false);
        }
      } catch (error) {
        console.error("Error fetching product countries in dashboard wrapper:", error);
        setLoadingCountries(false);
      }
    };
    checkProductMarket();

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loadingCountries) {
    return <Loader text="Verifying active markets..." />;
  }

  return (
    <div className="flex h-screen bg-bg theme-transition">
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} menuItems={menus} />

      <div className="flex flex-col flex-1 min-w-0">
        <Header isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} title="Solar Mega Watt Projects Dashboard" />

        <main className="flex-1 relative overflow-hidden mesh-grid bg-bg transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          
          <div className="relative h-full overflow-y-auto scrollbar-hover p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="min-h-full"
              >
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/:countryName" element={<Home />} />
                  <Route path="/:countryName/home" element={<Home />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
