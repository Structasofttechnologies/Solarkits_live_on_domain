import { useState, useCallback } from "react";
import Navbar from "../components/storefront/Navbar";
import HeroSection from "../components/storefront/HeroSection";
import WhySolarkits from "../components/storefront/WhySolarkits";
import BrowseByApplication from "../components/storefront/BrowseByApplication";
import BrowseByCapacity from "../components/storefront/BrowseByCapacity";
import BrowseByWattage from "../components/storefront/BrowseByWattage";
import SolarkitsCatalog from "../components/storefront/SolarkitsCatalog";
import GovSchemeSolutions from "../components/storefront/GovSchemeSolutions";
import DealerEpcSupport from "../components/storefront/DealerEpcSupport";
import FranchiseOpportunity from "../components/storefront/FranchiseOpportunity";
import HowProcurementWorks from "../components/storefront/HowProcurementWorks";
import StoreAvailabilityChecker from "../components/storefront/StoreAvailabilityChecker";
import EligibilityChecker from "../components/storefront/EligibilityChecker";
import RoiCalculator from "../components/storefront/RoiCalculator";
import TestimonialsProof from "../components/storefront/TestimonialsProof";
import FaqContactSection from "../components/storefront/FaqContactSection";
import Footer from "../components/storefront/Footer";

// Interactive Overlays
import LeadCaptureModal from "../components/storefront/LeadCaptureModal";
import KitDetailModal from "../components/storefront/KitDetailModal";
import KitCompareDrawer from "../components/storefront/KitCompareDrawer";
import MobileStickyBar from "../components/storefront/MobileStickyBar";

import { SOLARKITS_DATA } from "../data/solarkitsData";

export default function FranchiseLanding() {
  // Lead Capture Modal State
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalContext, setLeadModalContext] = useState({});
  const [leadActionType, setLeadActionType] = useState("bulk_price");

  // Kit Detail Modal State
  const [selectedKit, setSelectedKit] = useState(null);
  const [kitModalOpen, setKitModalOpen] = useState(false);

  // Compare List State
  const [compareList, setCompareList] = useState([]);

  // Filter override state passed from quick browse sections to Catalog
  const [filterOverride, setFilterOverride] = useState({});

  const handleOpenLeadModal = useCallback((context = {}, actionType = "bulk_price") => {
    setLeadModalContext(context);
    setLeadActionType(actionType);
    setLeadModalOpen(true);
  }, []);

  const handleOpenKitDetails = useCallback((kit) => {
    setSelectedKit(kit);
    setKitModalOpen(true);
  }, []);

  const handleToggleCompare = useCallback((kit) => {
    setCompareList((prev) => {
      const exists = prev.some((k) => k.id === kit.id);
      if (exists) {
        return prev.filter((k) => k.id !== kit.id);
      } else {
        if (prev.length >= 3) {
          alert("You can compare up to 3 SolarKits simultaneously.");
          return prev;
        }
        return [...prev, kit];
      }
    });
  }, []);

  const handleRemoveCompare = useCallback((kitId) => {
    setCompareList((prev) => prev.filter((k) => k.id !== kitId));
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  // Quick navigation handlers from browse sections
  const handleSelectApplication = (appType) => {
    setFilterOverride({ application: appType });
  };

  const handleSelectCapacity = (capacity) => {
    setFilterOverride({ capacity });
  };

  const handleSelectWattage = (wattage) => {
    setFilterOverride({ wattage });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#F49222] selection:text-white">
      
      {/* Fixed Navigation Header */}
      <Navbar onOpenLeadModal={handleOpenLeadModal} />

      {/* 1. Hero Section */}
      <HeroSection onOpenLeadModal={handleOpenLeadModal} />

      {/* 2. Why Solarkits Value Propositions */}
      <WhySolarkits />

      {/* 3. Browse by Application Type */}
      <BrowseByApplication onSelectApplication={handleSelectApplication} />

      {/* 4. Browse by System Capacity */}
      <BrowseByCapacity onSelectCapacity={handleSelectCapacity} />

      {/* 5. Browse by Panel Wattage & DCR Status */}
      <BrowseByWattage onSelectWattage={handleSelectWattage} />

      {/* 6. Featured Solarkits & Multi-Parameter Filter Engine */}
      <SolarkitsCatalog
        onOpenKitDetails={handleOpenKitDetails}
        onOpenLeadModal={handleOpenLeadModal}
        onToggleCompare={handleToggleCompare}
        compareList={compareList}
        filterOverride={filterOverride}
      />

      {/* 7. Government-Scheme and Tender-Oriented Solutions */}
      <GovSchemeSolutions onOpenLeadModal={handleOpenLeadModal} />

      {/* 8. Dealer and EPC Support */}
      <DealerEpcSupport onOpenLeadModal={handleOpenLeadModal} />

      {/* 9. Franchise Territory Opportunity */}
      <FranchiseOpportunity onOpenLeadModal={handleOpenLeadModal} />

      {/* 10. How Procurement Works */}
      <HowProcurementWorks />

      {/* 11. Store Availability Checker */}
      <StoreAvailabilityChecker onOpenLeadModal={handleOpenLeadModal} />

      {/* 12. Eligibility Checker */}
      <EligibilityChecker onOpenLeadModal={handleOpenLeadModal} />

      {/* 13. Revenue Potential Section */}
      <RoiCalculator onOpenLeadModal={handleOpenLeadModal} />

      {/* 14. Testimonials or Verified Business Proof */}
      <TestimonialsProof />

      {/* 15. Frequently Asked Questions & Final Consultation */}
      <FaqContactSection onOpenLeadModal={handleOpenLeadModal} />

      {/* 16. Storefront Footer */}
      <Footer onOpenLeadModal={handleOpenLeadModal} />

      {/* ── Interactive Overlays & Modals ─────────────────────────────── */}
      
      {/* Kit Detail Specifications Modal */}
      <KitDetailModal
        kit={selectedKit}
        isOpen={kitModalOpen}
        onClose={() => setKitModalOpen(false)}
        onOpenLeadModal={handleOpenLeadModal}
        onSelectAlternative={(alt) => setSelectedKit(alt)}
        allKits={SOLARKITS_DATA}
      />

      {/* Multi-Kit Side-by-Side Comparison Dock */}
      <KitCompareDrawer
        compareList={compareList}
        onRemove={handleRemoveCompare}
        onClear={handleClearCompare}
        onOpenKitDetails={handleOpenKitDetails}
        onOpenLeadModal={handleOpenLeadModal}
      />

      {/* Centralized CRM Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        initialContext={leadModalContext}
        actionType={leadActionType}
      />

      {/* Mobile Bottom Sticky Bar */}
      <MobileStickyBar onOpenLeadModal={handleOpenLeadModal} />

    </div>
  );
}
