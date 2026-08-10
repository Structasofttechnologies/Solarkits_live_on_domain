import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErpSystem from './pages/ErpSystem';
import HomePage from './pages/HomePage';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import LoginScreen from './pages/LoginScreen';
import SolarDealerApp from './pages/SolarDealerApp';
import SolarInstallerMarketplace from './pages/SolarInstallerMarketplace';
import SolarAmcManagement from './pages/SolarAmcManagement';
import SolarMegawattProjectManagement from './pages/SolarMegawattProjectManagement';
import FrontPage from './pages/FrontPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Initial route is ErpSystem as set in Flutter main.dart */}
        <Route path="/" element={<FrontPage />} />

        <Route path="/erp" element={<ErpSystem />} />
        {/* Marketing / Shop landing page */}
        <Route path="/solar-shop" element={<HomePage />} />

        {/* Other routes */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/solar-dealer" element={<SolarDealerApp />} />
        <Route path="/solar-installer" element={<SolarInstallerMarketplace />} />
        <Route path="/solar-amc" element={<SolarAmcManagement />} />
        <Route path="/megawatt-project" element={<SolarMegawattProjectManagement />} />

        {/* Fallback to ErpSystem */}
        <Route path="*" element={<ErpSystem />} />
      </Routes>
    </BrowserRouter>
  );
}
