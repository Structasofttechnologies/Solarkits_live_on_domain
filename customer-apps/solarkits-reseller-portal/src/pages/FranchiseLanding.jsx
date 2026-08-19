import Navbar from "../components/storefront/Navbar";
import HeroSection from "../components/storefront/HeroSection";
import PlansShowcase from "../components/storefront/PlansShowcase";
import ProductStoreShowcase from "../components/storefront/ProductStoreShowcase";
import FranchiseBenefits from "../components/storefront/FranchiseBenefits";
import RoiCalculator from "../components/storefront/RoiCalculator";
import OnboardingSteps from "../components/storefront/OnboardingSteps";
import FaqContactSection from "../components/storefront/FaqContactSection";
import Footer from "../components/storefront/Footer";

export default function FranchiseLanding() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#F49222] selection:text-white">
      {/* Fixed Navigation Header */}
      <Navbar />

      {/* Hero Value Proposition Banner */}
      <HeroSection />

      {/* Admin Synced Franchisee Subscription Plans */}
      <PlansShowcase />

      {/* Wholesale E-Commerce Store & Products Showcase */}
      <ProductStoreShowcase />

      {/* Franchise Business Ecosystem Benefits */}
      <FranchiseBenefits />

      {/* Interactive Revenue & Profit ROI Calculator */}
      <RoiCalculator />

      {/* 4-Step Onboarding Roadmap */}
      <OnboardingSteps />

      {/* FAQ & Direct Callback Consultation */}
      <FaqContactSection />

      {/* Storefront Footer */}
      <Footer />
    </div>
  );
}
