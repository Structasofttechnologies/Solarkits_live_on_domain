import { Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loader from "@/components/Loader";

const HeaderConfig = lazy(() => import("./HeaderConfig"));
const ErpModulesConfig = lazy(() => import("./ErpModulesConfig"));
const AboutUsConfig = lazy(() => import("./AboutUsConfig"));
const AboutMissionVisionConfig = lazy(() => import("./AboutMissionVisionConfig"));
const AboutValuesConfig = lazy(() => import("./AboutValuesConfig"));
const AboutCtaConfig = lazy(() => import("./AboutCtaConfig"));
const ServicesConfig = lazy(() => import("./ServicesConfig"));
const ContactConfig = lazy(() => import("./ContactConfig"));
const ContactHeroConfig = lazy(() => import("./ContactHeroConfig"));
const ContactMapFaqConfig = lazy(() => import("./ContactMapFaqConfig"));
const FooterConfig = lazy(() => import("./FooterConfig"));
const HappyUsersConfig = lazy(() => import("./HappyUsersConfig"));
const KeyFeaturesConfig = lazy(() => import("./KeyFeaturesConfig"));
const ErpScreenshotsConfig = lazy(() => import("./ErpScreenshotsConfig"));
const ErpBenefitsConfig = lazy(() => import("./ErpBenefitsConfig"));
const HeroSectionConfig = lazy(() => import("./HeroSectionConfig"));
const PricingPlansConfig = lazy(() => import("./PricingPlansConfig"));
const CallToActionConfig = lazy(() => import("./CallToActionConfig"));
const SolarShopHero = lazy(() => import("./SolarShopHero"));
const SolarShopSolutions = lazy(() => import("./SolarShopSolutions"));
const SolarShopCrm = lazy(() => import("./SolarShopCrm"));
const SolarShopWhyChoose = lazy(() => import("./SolarShopWhyChoose"));
const SolarShopMetrics = lazy(() => import("./SolarShopMetrics"));
const SolarShopTestimonials = lazy(() => import("./SolarShopTestimonials"));
const SolarShopCta = lazy(() => import("./SolarShopCta"));
const SolarShopMarketplace = lazy(() => import("./SolarShopMarketplace"));
const SolarShopMarketplaceFeatures = lazy(() => import("./SolarShopMarketplaceFeatures"));
const SolarShopMarketplaceSteps = lazy(() => import("./SolarShopMarketplaceSteps"));
const SolarShopMarketplaceWhyChoose = lazy(() => import("./SolarShopMarketplaceWhyChoose"));
const SolarShopMarketplaceCta = lazy(() => import("./SolarShopMarketplaceCta"));
const SolarDealerAppHero = lazy(() => import("./SolarDealerAppHero"));
const SolarDealerAppFeatures = lazy(() => import("./SolarDealerAppFeatures"));
const SolarDealerAppScreenshots = lazy(() => import("./SolarDealerAppScreenshots"));
const SolarMegawattHero = lazy(() => import("./SolarMegawattHero"));
const SolarMegawattPhases = lazy(() => import("./SolarMegawattPhases"));
const SolarMegawattFeatures = lazy(() => import("./SolarMegawattFeatures"));
const SolarMegawattScreenshots = lazy(() => import("./SolarMegawattScreenshots"));
const SolarAmcHero = lazy(() => import("./SolarAmcHero"));
const SolarAmcFeatures = lazy(() => import("./SolarAmcFeatures"));
const SolarAmcProcess = lazy(() => import("./SolarAmcProcess"));
const SolarAmcBenefits = lazy(() => import("./SolarAmcBenefits"));
const SolarAmcScreenshots = lazy(() => import("./SolarAmcScreenshots"));

export default function WebsiteConfiguration() {
  return (
    <Routes>
      <Route
        path="/hero-section/*"
        element={
          <Suspense fallback={<Loader text="Loading Hero Section Configuration..." />}>
            <HeroSectionConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/hero-section/*"
        element={
          <Suspense fallback={<Loader text="Loading Hero Section Configuration..." />}>
            <HeroSectionConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/erp-benefits/*"
        element={
          <Suspense fallback={<Loader text="Loading ERP Benefits Configuration..." />}>
            <ErpBenefitsConfig />
          </Suspense>
        }
      />
      <Route
        path="/erp-benefits/*"
        element={
          <Suspense fallback={<Loader text="Loading ERP Benefits Configuration..." />}>
            <ErpBenefitsConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/pricing-plans/*"
        element={
          <Suspense fallback={<Loader text="Loading Pricing Plans Configuration..." />}>
            <PricingPlansConfig />
          </Suspense>
        }
      />
      <Route
        path="/pricing-plans/*"
        element={
          <Suspense fallback={<Loader text="Loading Pricing Plans Configuration..." />}>
            <PricingPlansConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/call-to-action/*"
        element={
          <Suspense fallback={<Loader text="Loading Call To Action Configuration..." />}>
            <CallToActionConfig />
          </Suspense>
        }
      />
      <Route
        path="/call-to-action/*"
        element={
          <Suspense fallback={<Loader text="Loading Call To Action Configuration..." />}>
            <CallToActionConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/erp-modules/*"
        element={
          <Suspense fallback={<Loader text="Loading ERP Modules Configuration..." />}>
            <ErpModulesConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/happy-users/*"
        element={
          <Suspense fallback={<Loader text="Loading Happy Users Configuration..." />}>
            <HappyUsersConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/key-features/*"
        element={
          <Suspense fallback={<Loader text="Loading Key Features Configuration..." />}>
            <KeyFeaturesConfig />
          </Suspense>
        }
      />
      <Route
        path="/key-features/*"
        element={
          <Suspense fallback={<Loader text="Loading Key Features Configuration..." />}>
            <KeyFeaturesConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/erp-screenshots/*"
        element={
          <Suspense fallback={<Loader text="Loading ERP Screenshots Configuration..." />}>
            <ErpScreenshotsConfig />
          </Suspense>
        }
      />
      <Route
        path="/erp-screenshots/*"
        element={
          <Suspense fallback={<Loader text="Loading ERP Screenshots Configuration..." />}>
            <ErpScreenshotsConfig />
          </Suspense>
        }
      />
      <Route
        path="/header/*"
        element={
          <Suspense fallback={<Loader text="Loading Header Configuration..." />}>
            <HeaderConfig />
          </Suspense>
        }
      />
      <Route
        path="/erp-modules/*"
        element={
          <Suspense fallback={<Loader text="Loading ERP Modules Configuration..." />}>
            <ErpModulesConfig />
          </Suspense>
        }
      />
      <Route
        path="/happy-users/*"
        element={
          <Suspense fallback={<Loader text="Loading Happy Users Configuration..." />}>
            <HappyUsersConfig />
          </Suspense>
        }
      />
      <Route
        path="/about-us/banner/*"
        element={
          <Suspense fallback={<Loader text="Loading About Us Configuration..." />}>
            <AboutUsConfig />
          </Suspense>
        }
      />
      <Route
        path="/about-us/mission-vision/*"
        element={
          <Suspense fallback={<Loader text="Loading Mission & Vision Configuration..." />}>
            <AboutMissionVisionConfig />
          </Suspense>
        }
      />
      <Route
        path="/about-us/values/*"
        element={
          <Suspense fallback={<Loader text="Loading Values Configuration..." />}>
            <AboutValuesConfig />
          </Suspense>
        }
      />
      <Route
        path="/about-us/cta/*"
        element={
          <Suspense fallback={<Loader text="Loading Ready To Go Solar Configuration..." />}>
            <AboutCtaConfig />
          </Suspense>
        }
      />
      <Route
        path="/about-us/*"
        element={<Navigate to="/admin-panel/website-configuration/about-us/banner" replace />}
      />
      <Route
        path="/services/*"
        element={
          <Suspense fallback={<Loader text="Loading Services Configuration..." />}>
            <ServicesConfig />
          </Suspense>
        }
      />
      <Route
        path="/contact/details/*"
        element={
          <Suspense fallback={<Loader text="Loading Contact Details Configuration..." />}>
            <ContactConfig />
          </Suspense>
        }
      />
      <Route
        path="/contact/hero/*"
        element={
          <Suspense fallback={<Loader text="Loading Get In Touch Configuration..." />}>
            <ContactHeroConfig />
          </Suspense>
        }
      />
      <Route
        path="/contact/map-faqs/*"
        element={
          <Suspense fallback={<Loader text="Loading Map & FAQs Configuration..." />}>
            <ContactMapFaqConfig />
          </Suspense>
        }
      />
      <Route
        path="/contact/*"
        element={<Navigate to="/admin-panel/website-configuration/contact/hero" replace />}
      />
      <Route
        path="/footer/*"
        element={
          <Suspense fallback={<Loader text="Loading Footer Configuration..." />}>
            <FooterConfig />
          </Suspense>
        }
      />
      <Route
        path="/marketplace/hero/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Installer Marketplace Hero Configuration..." />}>
            <SolarShopMarketplace />
          </Suspense>
        }
      />
      <Route
        path="/marketplace/features/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Installer Marketplace Features Configuration..." />}>
            <SolarShopMarketplaceFeatures />
          </Suspense>
        }
      />
      <Route
        path="/marketplace/steps/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Installer Marketplace Steps Configuration..." />}>
            <SolarShopMarketplaceSteps />
          </Suspense>
        }
      />
      <Route
        path="/marketplace/why-choose/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Installer Marketplace Why Choose Configuration..." />}>
            <SolarShopMarketplaceWhyChoose />
          </Suspense>
        }
      />
      <Route
        path="/marketplace/cta/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Installer Marketplace CTA Configuration..." />}>
            <SolarShopMarketplaceCta />
          </Suspense>
        }
      />
      <Route
        path="/marketplace/*"
        element={<Navigate to="/admin-panel/website-configuration/marketplace/hero" replace />}
      />
      <Route
        path="/dealer-app/hero/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Dealer App Hero Configuration..." />}>
            <SolarDealerAppHero />
          </Suspense>
        }
      />
      <Route
        path="/dealer-app/features/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Dealer App Features Configuration..." />}>
            <SolarDealerAppFeatures />
          </Suspense>
        }
      />
      <Route
        path="/dealer-app/screenshots/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Dealer App Screenshots Configuration..." />}>
            <SolarDealerAppScreenshots />
          </Suspense>
        }
      />
      <Route
        path="/dealer-app/*"
        element={<Navigate to="/admin-panel/website-configuration/dealer-app/hero" replace />}
      />
      <Route
        path="/megawatt/hero/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Megawatt Hero Configuration..." />}>
            <SolarMegawattHero />
          </Suspense>
        }
      />
      <Route
        path="/megawatt/phases/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Megawatt Phases Configuration..." />}>
            <SolarMegawattPhases />
          </Suspense>
        }
      />
      <Route
        path="/megawatt/features/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Megawatt Features Configuration..." />}>
            <SolarMegawattFeatures />
          </Suspense>
        }
      />
      <Route
        path="/megawatt/screenshots/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Megawatt Screenshots Configuration..." />}>
            <SolarMegawattScreenshots />
          </Suspense>
        }
      />
      <Route
        path="/megawatt/*"
        element={<Navigate to="/admin-panel/website-configuration/megawatt/hero" replace />}
      />
      <Route
        path="/amc/hero/*"
        element={<Suspense fallback={<Loader text="Loading Solar AMC Hero Configuration..." />}><SolarAmcHero /></Suspense>}
      />
      <Route
        path="/amc/features/*"
        element={<Suspense fallback={<Loader text="Loading Solar AMC Features Configuration..." />}><SolarAmcFeatures /></Suspense>}
      />
      <Route
        path="/amc/process/*"
        element={<Suspense fallback={<Loader text="Loading Solar AMC Process Configuration..." />}><SolarAmcProcess /></Suspense>}
      />
      <Route
        path="/amc/benefits/*"
        element={<Suspense fallback={<Loader text="Loading Solar AMC Benefits Configuration..." />}><SolarAmcBenefits /></Suspense>}
      />
      <Route
        path="/amc/screenshots/*"
        element={<Suspense fallback={<Loader text="Loading Solar AMC Screenshots Configuration..." />}><SolarAmcScreenshots /></Suspense>}
      />
      <Route
        path="/amc/*"
        element={<Navigate to="/admin-panel/website-configuration/amc/hero" replace />}
      />
      <Route
        path="/solar-shop/solutions/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Shop Solutions Configuration..." />}>
            <SolarShopSolutions />
          </Suspense>
        }
      />
      <Route
        path="/solar-shop/crm/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Shop CRM Configuration..." />}>
            <SolarShopCrm />
          </Suspense>
        }
      />
      <Route
        path="/solar-shop/why-choose/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Shop Why Choose Us Configuration..." />}>
            <SolarShopWhyChoose />
          </Suspense>
        }
      />
      <Route
        path="/solar-shop/metrics/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Shop Metrics Configuration..." />}>
            <SolarShopMetrics />
          </Suspense>
        }
      />
      <Route
        path="/solar-shop/testimonials/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Shop Testimonials Configuration..." />}>
            <SolarShopTestimonials />
          </Suspense>
        }
      />
      <Route
        path="/solar-shop/cta/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Shop CTA Configuration..." />}>
            <SolarShopCta />
          </Suspense>
        }
      />
      <Route
        path="/solar-shop/hero/*"
        element={
          <Suspense fallback={<Loader text="Loading Solar Shop Hero Configuration..." />}>
            <SolarShopHero />
          </Suspense>
        }
      />



      <Route
        path="/solar-shop/*"
        element={<Navigate to="/admin-panel/website-configuration/solar-shop/hero" replace />}
      />
      <Route path="/" element={<Navigate to="/admin-panel/website-configuration/header" replace />} />
      <Route path="*" element={<Navigate to="/admin-panel/website-configuration/header" replace />} />
    </Routes>
  );
}
