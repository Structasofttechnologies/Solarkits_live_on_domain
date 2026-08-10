import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sun,
  Play,
  X,
  CheckCircle,
  Bolt,
  BatteryCharging,
  Smartphone,
  BarChart3,
  Layers,
  Sparkles,
  ChevronRight,
  UserPlus,
  FileText,
  FileSpreadsheet,
  Workflow,
  HelpCircle,
  Warehouse,
  Users,
  Award,
  Globe,
  Star,
  CheckSquare
} from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';
import Carousel from '../components/Carousel';

// Motion variants for stagger layout
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeInSlideUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ICON_MAP = {
  Layers,
  Smartphone,
  BarChart3,
  Sparkles,
  UserPlus,
  FileText,
  FileSpreadsheet,
  Workflow,
  HelpCircle,
  Warehouse,
  Users,
  CheckSquare,
  Award,
  Globe
};

export default function HomePage() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [config, setConfig] = useState({
    welcomeTag: "Welcome to Solar Business Platform",
    heroTitle: "One Stop Shop For Solar Material Kit",
    heroSubtitle: "Made Solarkits",
    heroDescription: "Premium quality solar kits for residential and commercial use. Transform your solar business with our multi-branded solutions. Experience the future of solar energy management.",
    features: ["Free Delivery", "Multi-Brand Solar Kits", "Quick Delivery Time", "Free Service"],
    videoTitle: "How It Works",
    videoSubtitle: "Watch our platform demo",
    videoDuration: "2:30 min",
    videoUrl: "",
    solutionsTag: "Our Software Solutions",
    solutionsTitle: "Digital Solutions for Modern Solar Business",
    solutionsSubtitle: "Comprehensive software suite to manage every aspect of your solar business",
    solutionsList: [
      {
        title: "Solar Installer Marketplace",
        description: "Connect with top solar installers, compare quotes, and manage installations seamlessly.",
        icon: "Layers",
        color: "from-blue-500/20 to-blue-600/20 text-blue-600",
        path: "/solar-installer",
      },
      {
        title: "Solar Dealer App",
        description: "Powerful mobile app for solar dealers to manage inventory, orders, and customer relationships.",
        icon: "Smartphone",
        color: "from-green-500/20 to-green-600/20 text-green-600",
        path: "/solar-dealer",
      },
      {
        title: "Solar Mega Watt Project Management",
        description: "Advanced project management tools for large-scale solar installations.",
        icon: "BarChart3",
        color: "from-purple-500/20 to-purple-600/20 text-purple-600",
        path: "/megawatt-project",
      },
      {
        title: "Solar AMC Management",
        description: "Complete annual maintenance contract management for solar assets.",
        icon: "Sparkles",
        color: "from-red-500/20 to-red-600/20 text-red-600",
        path: "/solar-amc",
      }
    ],
    crmTitle: "CRM Modules",
    crmSubtitle: "Complete customer lifecycle management",
    crmList: [
      {
        title: "Lead Management",
        badge: "2,500+ LEADS/MONTH",
        description: "Capture, track, and convert leads efficiently with automated follow-ups and scoring.",
        icon: "UserPlus",
        color: "from-blue-500/20 to-blue-600/20 text-blue-600"
      },
      {
        title: "Quotation Management",
        badge: "500+ QUOTES/MONTH",
        description: "Create professional quotes, send to customers, and track approval status in real-time.",
        icon: "FileText",
        color: "from-green-500/20 to-green-600/20 text-green-600"
      },
      {
        title: "Project Signup",
        badge: "98% FASTER SIGNUP",
        description: "Streamlined project onboarding with digital signatures and document collection.",
        icon: "CheckSquare",
        color: "from-orange-500/20 to-orange-600/20 text-orange-600"
      },
      {
        title: "Project Management",
        badge: "150+ ACTIVE PROJECTS",
        description: "End-to-end project tracking from initiation to completion with milestone management.",
        icon: "Layers",
        color: "from-purple-500/20 to-purple-600/20 text-purple-600"
      },
      {
        title: "Service Management",
        badge: "98% SATISFACTION",
        description: "Manage service requests, schedule visits, and track resolution efficiently.",
        icon: "HelpCircle",
        color: "from-red-500/20 to-red-600/20 text-red-600"
      },
      {
        title: "My Warehouse",
        badge: "10K+ SKUS",
        description: "Real-time inventory tracking, stock alerts, and warehouse management system.",
        icon: "Warehouse",
        color: "from-teal-500/20 to-teal-600/20 text-teal-600"
      },
      {
        title: "Customer Center",
        badge: "5,000+ CUSTOMERS",
        description: "360-degree customer view with interaction history, documents, and communication logs.",
        icon: "Users",
        color: "from-indigo-500/20 to-indigo-600/20 text-indigo-600"
      }
    ],
    whyChooseTitle: "Why Choose Us",
    whyChooseSubtitle: "We deliver excellence through our dedicated service",
    whyChooseList: [
      {
        title: "Best Price Guarantee",
        description: "We offer competitive and direct manufacturer prices for all solar materials and modules.",
        icon: "Award",
        color: "from-orange-500/20 to-orange-600/20 text-orange-600"
      },
      {
        title: "Wide Supplier Network",
        description: "Choose from a network of trusted brands and quality manufacturers across the country.",
        icon: "Globe",
        color: "from-blue-500/20 to-blue-600/20 text-blue-600"
      },
      {
        title: "Expert System Integrators",
        description: "Our certified engineering teams handle seamless integrations and testing for perfect performance.",
        icon: "Sparkles",
        color: "from-amber-500/20 to-amber-600/20 text-amber-600"
      }
    ],
    metricsTitle: "Performance Metrics",
    metricsList: [
      { val: "100+", label: "SUCCESSFUL PROJECTS" },
      { val: "99.9%", label: "SYSTEM UPTIME" },
      { val: "4.9/5", label: "CLIENT RATING" },
      { val: "20K Tons", label: "CARBON REDUCTION" }
    ],
    testimonialsTitle: "What Our Partners Say",
    testimonialsList: [
      { name: "Rajesh Kumar", role: "EPC Contractor", company: "SunPower Solutions", testimonial: "The platform has completely transformed how we manage our solar projects. No more inventory headaches! The efficiency gain is remarkable.", rating: 5 },
      { name: "Priya Sharma", role: "Solar Dealer", company: "Green Energy Stores", testimonial: "Best decision we made for our business. The dealer app is incredibly user-friendly and efficient. Our sales have increased by 40%.", rating: 5 },
      { name: "Amit Patel", role: "Project Manager", company: "MegaSolar Corp", testimonial: "The project management tools are outstanding. We've completed 3MW projects ahead of schedule with better resource utilization.", rating: 5 },
      { name: "Sunita Reddy", role: "CEO", company: "SolarTech Industries", testimonial: "The ERP system streamlined our entire operation. From procurement to delivery, everything is now automated and efficient.", rating: 5 }
    ],
    ctaTitle: "Ready to Power Your Solar Business?",
    ctaDescription: "Join EmergeSun today and gain complete control over your project lifecycle, supplier contracts, and sales dashboards.",
    ctaButtonText: "Get Started Now",
    ctaButtonLink: "/login",
    enableHero: true,
    enableSolutions: true,
    enableCrm: true,
    enableWhyChoose: true,
    enableMetrics: true,
    enableTestimonials: true,
    enableCta: true,
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/solar-shop/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setConfig((prev) => {
            const merged = { ...prev };
            for (const key in data.data) {
              if (data.data[key] !== undefined && data.data[key] !== null && data.data[key] !== "") {
                merged[key] = data.data[key];
              }
            }
            if (Array.isArray(data.data.features) && data.data.features.length > 0) {
              merged.features = data.data.features;
            }
            if (Array.isArray(data.data.solutionsList) && data.data.solutionsList.length > 0) {
              merged.solutionsList = data.data.solutionsList;
            }
            if (Array.isArray(data.data.crmList) && data.data.crmList.length > 0) {
              merged.crmList = data.data.crmList;
            }
            if (Array.isArray(data.data.whyChooseList) && data.data.whyChooseList.length > 0) {
              merged.whyChooseList = data.data.whyChooseList;
            }
            if (Array.isArray(data.data.metricsList) && data.data.metricsList.length > 0) {
              merged.metricsList = data.data.metricsList;
            }
            if (Array.isArray(data.data.testimonialsList) && data.data.testimonialsList.length > 0) {
              merged.testimonialsList = data.data.testimonialsList;
            }
            return merged;
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Solar Shop configuration:', err);
      });
  }, []);

  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("/embed/")) return url;

    // Match youtu.be/ID
    const youtuBeRegex = /youtu\.be\/([a-zA-Z0-9_-]{11})/i;
    const youtuBeMatch = url.match(youtuBeRegex);
    if (youtuBeMatch) {
      return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;
    }

    // Match youtube.com/watch?v=ID
    const youtubeWatchRegex = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i;
    const youtubeWatchMatch = url.match(youtubeWatchRegex);
    if (youtubeWatchMatch) {
      return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
    }

    // Match youtube.com/shorts/ID
    const youtubeShortsRegex = /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i;
    const youtubeShortsMatch = url.match(youtubeShortsRegex);
    if (youtubeShortsMatch) {
      return `https://www.youtube.com/embed/${youtubeShortsMatch[1]}`;
    }

    return url;
  };

  const renderTitle = (title) => {
    if (!title) return null;
    const words = title.split(" ");
    if (words.length <= 2) {
      return <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">{title}</span>;
    }
    const normalPart = words.slice(0, -3).join(" ");
    const gradientPart = words.slice(-3).join(" ");
    return (
      <>
        {normalPart} {normalPart ? <br /> : ""}
        <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">{gradientPart}</span>
      </>
    );
  };

  // softwareSolutions, crmModules and testimonials static arrays removed, now dynamically fetched from config

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SolarHeader />

      {/* Hero Section */}
      {config.enableHero && (
        <section className="relative w-full bg-gradient-to-br from-blue-50/70 via-white to-orange-50/70 px-6 py-20 md:px-16 lg:px-24 overflow-hidden border-b border-gray-100">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row">

            {/* Left Text */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="flex-1 text-left"
            >
              <div className="inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-orange to-deep-orange px-4 py-2 text-white shadow-lg shadow-orange/20">
                <Sun className="h-4 w-4 animate-spin-slow" />
                <span className="text-xs font-bold tracking-wide uppercase">{config.welcomeTag}</span>
              </div>

              <h1 className="mt-8 text-4xl font-black leading-tight text-gray-800 md:text-5xl lg:text-6.5xl tracking-tight">
                {renderTitle(config.heroTitle)}
              </h1>

              <h2 className="mt-4 text-2xl font-bold text-gray-700">
                Our <span className="text-blue-600 font-extrabold relative">{config.heroSubtitle ? config.heroSubtitle.replace(/^our\s+/i, "") : ""} <span className="absolute left-0 bottom-0 w-full h-[3px] bg-blue-600/30 rounded-full" /></span>
              </h2>

              <p className="mt-6 text-base leading-relaxed text-gray-500 max-w-lg">
                {config.heroDescription}
              </p>

              <div className="mt-8 grid gap-4 grid-cols-2 max-w-md">
                {config.features.map((feat) => (
                  <div key={feat} className="flex items-center space-x-2 text-gray-600 font-bold">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feat}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Video Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="flex-1 w-full max-w-xl relative"
            >
              <div className="relative h-[480px] w-full rounded-[32px] bg-gradient-to-br from-primary to-purple-600 shadow-2xl shadow-primary/30 overflow-hidden flex flex-col justify-between p-8 text-white group border border-white/10">

                {/* Glassmorphism visual layer */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

                {/* Floating Icons */}
                <div className="absolute top-10 left-10 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border border-white/20 text-orange float-animation shadow-lg backdrop-blur-md">
                  <Sun className="h-7 w-7" />
                </div>
                <div className="absolute bottom-20 right-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 text-yellow float-animation shadow-lg backdrop-blur-md">
                  <Bolt className="h-6 w-6" />
                </div>
                <div className="absolute top-20 right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-green float-animation shadow-lg backdrop-blur-md">
                  <BatteryCharging className="h-5 w-5" />
                </div>

                {/* Play Button with hover pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setVideoOpen(true)}
                    className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15 border border-white/40 hover:bg-white/25 transition-colors text-white shadow-2xl backdrop-blur-md focus:outline-none relative"
                  >
                    <Play className="h-14 w-14 fill-white translate-x-1" />
                    <span className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping pointer-events-none" />
                  </motion.button>
                </div>

                {/* Bottom Video Info */}
                <div className="mt-auto flex items-center justify-between bg-black/30 backdrop-blur-xl rounded-2xl p-4 w-full border border-white/10 shadow-lg">
                  <div>
                    <h4 className="font-bold text-white text-base">{config.videoTitle}</h4>
                    <p className="text-xs text-gray-200">{config.videoSubtitle}</p>
                  </div>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{config.videoDuration}</span>
                </div>
              </div>
            </motion.div>

          </div>
        </section>
      )}

      {/* Video Modal Dialog */}
      <AnimatePresence>
        {videoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="relative w-full max-w-4xl rounded-3xl bg-black overflow-hidden aspect-video flex flex-col items-center justify-center text-white p-6 shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setVideoOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-orange transition-colors focus:outline-none"
              >
                <X className="h-8 w-8" />
              </button>
              {config.videoUrl ? (
                <iframe
                  src={getEmbedUrl(config.videoUrl)}
                  title={config.videoTitle}
                  className="w-full h-full rounded-2xl"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <>
                  <Play className="h-20 w-20 text-white/45 animate-pulse" />
                  <h3 className="mt-6 text-2xl font-bold">Demo Video Player</h3>
                  <p className="mt-2 text-gray-400">Your promotional video will play here</p>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Software Solutions Section */}
      {config.enableSolutions && (
        <section className="w-full bg-white px-6 py-24 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <span className="text-xs font-extrabold tracking-[0.25em] text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full">
              {config.solutionsTag || "Our Software Solutions"}
            </span>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl">
              {config.solutionsTitle}
            </h2>
            <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              {config.solutionsSubtitle}
            </p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
            >
              {(config.solutionsList || []).filter(sol => sol.enabled !== false).map((sol, idx) => {
                const IconComp = ICON_MAP[sol.icon] || HelpCircle;
                return (
                  <motion.div
                    key={idx}
                    variants={fadeInSlideUp}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group rounded-2xl bg-white p-8 text-left shadow-md hover:shadow-xl transition-all flex flex-col justify-between h-[340px] relative overflow-hidden"
                  >
                    {/* Decorative background glow on hover */}
                    <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-orange/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl pointer-events-none" />

                    <div>
                      <div className={`inline-flex rounded-2xl bg-gradient-to-br ${sol.color || "from-blue-500/20 to-blue-600/20 text-blue-600"} p-4 text-white shadow-md shadow-primary/5`}>
                        <IconComp className="h-6 w-6" />
                      </div>
                      <h3 className="mt-6 text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">{sol.title}</h3>
                      <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-3">{sol.description}</p>
                    </div>

                    <Link
                      to={sol.path || "#"}
                      className="mt-6 inline-flex items-center text-sm font-bold text-orange group-hover:text-orange-dark space-x-1"
                    >
                      <span>Learn More</span>
                      <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* CRM Modules Section */}
      {config.enableCrm && (
        <section className="w-full bg-gradient-to-br from-blue-50/40 via-white to-orange-50/40 px-6 py-24 md:px-16 lg:px-24 border-y border-gray-100">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl">{config.crmTitle}</h2>
            <p className="mt-4 text-base text-gray-500">{config.crmSubtitle}</p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-16 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            >
              {(config.crmList || []).filter(crm => crm.enabled !== false).map((crm, idx) => {
                const IconComp = ICON_MAP[crm.icon] || Users;
                return (
                  <motion.div
                    key={idx}
                    variants={fadeInSlideUp}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group rounded-2xl bg-white p-6 text-left shadow-md hover:shadow-xl transition-all flex flex-col justify-between min-h-[250px] relative overflow-hidden"
                  >
                    <div>
                      <div className={`inline-flex rounded-xl p-3 bg-gradient-to-br ${crm.color || "from-blue-500/20 to-blue-600/20 text-blue-600"} shadow-sm`}>
                        <IconComp className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-gray-800 group-hover:text-primary transition-colors">{crm.title}</h3>
                      <span className="inline-block mt-0.5 text-[9px] font-black text-gray-400 uppercase tracking-wider">{crm.badge}</span>
                      <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-3">{crm.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      {config.enableWhyChoose && (
        <section className="w-full bg-white px-6 py-24 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl">{config.whyChooseTitle}</h2>
            <p className="mt-4 text-base text-gray-500">{config.whyChooseSubtitle}</p>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {(config.whyChooseList || []).filter(card => card.enabled !== false).map((card, idx) => {
                const IconComp = ICON_MAP[card.icon] || Award;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="rounded-3xl p-8 bg-white shadow-md hover:shadow-2xl transition-all text-center flex flex-col items-center"
                  >
                    <div className={`rounded-2xl bg-gradient-to-br ${card.color || "from-orange-500/20 to-orange-600/20 text-orange-600"} p-5 mb-6 shadow-inner`}>
                      <IconComp className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{card.title}</h3>
                    <p className="mt-4 text-sm text-gray-500 leading-relaxed">{card.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Performance Stats Section */}
      {config.enableMetrics && (
        <section className="w-full bg-gradient-to-br from-blue-50/40 via-white to-orange-50/40 px-6 py-20 md:px-16 lg:px-24 border-t border-gray-100">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl">{config.metricsTitle}</h2>

            <div className="mt-16 grid gap-6 grid-cols-2 lg:grid-cols-4">
              {(config.metricsList || []).filter(perf => perf.enabled !== false).map((perf, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.95, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm flex flex-col items-center hover:shadow-md transition-shadow"
                >
                  <span className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">{perf.val}</span>
                  <span className="mt-3 text-xs md:text-sm text-gray-400 font-bold uppercase tracking-wider">{perf.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {config.enableTestimonials && (
        <section className="w-full bg-white px-6 py-24 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-800 md:text-5xl">{config.testimonialsTitle}</h2>

            <div className="mt-16">
              <Carousel
                items={(config.testimonialsList || []).filter(t => t.enabled !== false)}
                renderItem={(t) => (
                  <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 md:p-12 shadow-xl border border-gray-100 text-center flex flex-col items-center">
                    <div className="flex space-x-1 justify-center mb-6">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 fill-yellow text-yellow" />
                      ))}
                    </div>
                    <p className="text-xl md:text-2xl italic font-medium text-gray-700 leading-relaxed">
                      "{t.testimonial}"
                    </p>
                    <div className="mt-8 flex flex-col items-center">
                      <span className="text-lg font-bold text-gray-900">{t.name}</span>
                      <span className="text-sm font-semibold text-gray-400 mt-1">{t.role}, {t.company}</span>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </section>
      )}

      

      {/* CTA Section */}
      {config.enableCta && (
        <section className="w-full bg-gradient-to-r from-primary via-blue-700 to-indigo-800 px-6 py-20 md:px-16 lg:px-24 text-white text-center relative overflow-hidden">
          {/* Glow light background decoration */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-4xl relative z-10 space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">{config.ctaTitle}</h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
              {config.ctaDescription}
            </p>
            <div className="pt-4 flex justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={config.ctaButtonLink || "/login"}
                  className="inline-block rounded-xl bg-orange hover:bg-orange/95 text-white font-bold text-lg px-10 py-4 shadow-lg shadow-orange/20 transition-all"
                >
                  {config.ctaButtonText}
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      <FooterWidget />
    </div>
  );
}
