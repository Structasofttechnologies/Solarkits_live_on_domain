// src/pages/LandingPage.jsx
import { useEffect } from 'react';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import WhyChooseSection from '../components/landing/WhyChooseSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import SolarBenefitsSection from '../components/landing/SolarBenefitsSection';
import PlansSection from '../components/landing/PlansSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQSection from '../components/landing/FAQSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Emergesun AMC Cloud | Solar AMC Management ERP System';
  }, []);

  return (
    <div className="min-h-screen bg-bg font-sans text-text-primary antialiased selection:bg-solar/30 selection:text-navy selection:font-semibold">
      <Navbar />
      <main>
        <HeroSection />
        <WhyChooseSection />
        <FeaturesSection />
        <SolarBenefitsSection />
        <PlansSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
