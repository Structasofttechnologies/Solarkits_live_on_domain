import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from "../services/api";
import {
  getMyIndustries,
  getDashboardContent,
  getIndustryTheme,
  getRelatedProducts,
  trackContentEvent,
} from "../services/industryContent";
import IndustrySelector from "../components/industry/IndustrySelector";
import HeroBanner from "../components/industry/HeroBanner";
import MediaSlider from "../components/industry/MediaSlider";
import ExplainerVideoSection from "../components/industry/ExplainerVideoSection";
import { HeroBannerSkeleton, SliderSkeleton, VideoGridSkeleton } from "../components/industry/IndustryContentSkeleton";
import ContentEmptyState from "../components/industry/ContentEmptyState";
import {
  FiZap,
  FiShield,
  FiUsers,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPackage,
  FiShoppingBag,
  FiRefreshCw,
  FiLayers,
} from "react-icons/fi";
import { MdOutlineFactory } from "react-icons/md";

export default function DashboardHome() {
  const { reseller } = useOutletContext();
  const resellerId = reseller?.id || reseller?._id || null;
  const [buyers, setBuyers] = useState([]);
  
  // Industry state
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [loadingIndustries, setLoadingIndustries] = useState(true);

  // Content state
  const [contents, setContents] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [theme, setTheme] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cache by industryId in ref to prevent blinking on re-render
  const cacheRef = useRef({});

  // Fetch buyers for stats (only once)
  useEffect(() => {
    api.get('/india/v1/reseller/epc-buyers/list')
      .then((res) => {
        if (res.data?.status === "success") setBuyers(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  // 1. Fetch approved industries for this reseller (only once on mount)
  useEffect(() => {
    let isMounted = true;
    setLoadingIndustries(true);

    getMyIndustries()
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.status === "success") {
          const list = res.data.data || [];
          setIndustries(list);

          const savedId = localStorage.getItem("reseller_selected_industry_id");
          const found = list.find((i) => (i.id || i._id) === savedId);

          if (found) {
            setSelectedIndustry(found);
          } else if (list.length > 0) {
            setSelectedIndustry(list[0]);
            localStorage.setItem("reseller_selected_industry_id", list[0].id || list[0]._id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch reseller industries:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingIndustries(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch content & theme only when selectedIndustryId changes
  const selectedIndustryId = selectedIndustry?.id || selectedIndustry?._id || null;

  const loadIndustryData = useCallback((industryId, forceRefresh = false) => {
    if (!industryId) return;

    // Check memory cache to avoid flicker
    if (!forceRefresh && cacheRef.current[industryId]) {
      const cached = cacheRef.current[industryId];
      setContents(cached.contents || []);
      setTheme(cached.theme || null);
      setProducts(cached.products || []);
      return;
    }

    setLoadingContent(true);
    setLoadingProducts(true);

    Promise.allSettled([
      getDashboardContent(industryId),
      getIndustryTheme(industryId),
      getRelatedProducts(industryId, 1, 6),
    ]).then(([contentRes, themeRes, productRes]) => {
      const items = contentRes.status === "fulfilled" && contentRes.value.data?.status === "success"
        ? contentRes.value.data.data || []
        : [];
      
      const themeData = themeRes.status === "fulfilled" && themeRes.value.data?.status === "success"
        ? themeRes.value.data.data || null
        : null;

      const productItems = productRes.status === "fulfilled" && productRes.value.data?.status === "success"
        ? productRes.value.data.data || []
        : [];

      // Save to cache
      cacheRef.current[industryId] = {
        contents: items,
        theme: themeData,
        products: productItems,
      };

      setContents(items);
      setTheme(themeData);
      setProducts(productItems);

      // Track impressions
      if (resellerId) {
        items.forEach((item) => {
          trackContentEvent({
            content_id: item.id || item._id,
            industry_type_id: industryId,
            event_type: 'IMPRESSION',
            placement: item.placement,
            user_type: 'RESELLER',
            user_id: resellerId,
          });
        });
      }
    }).finally(() => {
      setLoadingContent(false);
      setLoadingProducts(false);
    });
  }, [resellerId]);

  useEffect(() => {
    if (selectedIndustryId) {
      loadIndustryData(selectedIndustryId);
    }
  }, [selectedIndustryId, loadIndustryData]);

  const handleSelectIndustry = (industry) => {
    if ((industry.id || industry._id) === selectedIndustryId) return;
    setSelectedIndustry(industry);
    const id = industry.id || industry._id;
    localStorage.setItem("reseller_selected_industry_id", id);
  };

  // Group content by types
  const heroContent = useMemo(() => {
    return contents.find((c) => c.content_type === 'HERO_BANNER') || 
           contents.find((c) => c.content_type === 'VIDEO_SLIDER' && c.placement === 'DASHBOARD_TOP') ||
           contents[0] || null;
  }, [contents]);

  const sliderItems = useMemo(() => {
    return contents.filter((c) => 
      (c.content_type === 'IMAGE_SLIDER' || c.content_type === 'VIDEO_SLIDER') && 
      (c.id !== heroContent?.id && c._id !== heroContent?._id)
    );
  }, [contents, heroContent]);

  const explainerVideos = useMemo(() => {
    return contents.filter((c) => c.content_type === 'EXPLAINER_VIDEO');
  }, [contents]);

  const promotionalCards = useMemo(() => {
    return contents.filter((c) => c.content_type === 'PROMOTIONAL_CARD');
  }, [contents]);

  // Scoped theme styles
  const themeStyles = useMemo(() => {
    if (!theme) return {};
    const styles = {};
    if (theme.primary_color) styles['--color-primary'] = theme.primary_color;
    if (theme.secondary_color) styles['--color-secondary'] = theme.secondary_color;
    if (theme.accent_color) styles['--color-accent'] = theme.accent_color;
    if (theme.section_bg) styles['--color-section-bg'] = theme.section_bg;
    return styles;
  }, [theme]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto transition-opacity duration-300" style={themeStyles}>
      
      {/* ── 1. Industry Switcher Bar ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MdOutlineFactory size={18} />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Industry Segment
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {selectedIndustry ? selectedIndustry.name : "Select an Industry"}
              </h2>
            </div>
          </div>
          {selectedIndustry && (
            <button
              onClick={() => loadIndustryData(selectedIndustryId, true)}
              className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1.5 cursor-pointer self-end sm:self-center transition-colors"
            >
              <FiRefreshCw size={12} className={loadingContent ? "animate-spin" : ""} />
              Refresh Content
            </button>
          )}
        </div>

        <IndustrySelector
          industries={industries}
          selected={selectedIndustry}
          onSelect={handleSelectIndustry}
          loading={loadingIndustries}
        />
      </div>

      {/* ── 2. Dynamic Industry Hero Banner / Video ────────────────────────── */}
      {loadingContent && contents.length === 0 ? (
        <HeroBannerSkeleton />
      ) : heroContent ? (
        <HeroBanner
          content={heroContent}
          onCtaClick={(c) => {
            if (resellerId) {
              trackContentEvent({
                content_id: c.id || c._id,
                industry_type_id: selectedIndustryId,
                event_type: 'CTA_CLICK',
                placement: c.placement,
                user_type: 'RESELLER',
                user_id: resellerId,
              });
            }
          }}
        />
      ) : (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md">
              <FiZap size={14} /> Reseller Dashboard {selectedIndustry ? `• ${selectedIndustry.name}` : ''}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Welcome, {reseller?.business_name || "Partner"}!
            </h1>
            <p className="text-sm font-medium text-blue-100 max-w-xl">
              Manage your solar business pipeline, onboard EPC buyers, and explore industry-tailored solar kits & components.
            </p>
          </div>
          <div className="relative z-10 flex gap-3">
            <Link
              to="/catalog"
              className="px-5 py-2.5 bg-white text-blue-900 rounded-2xl text-xs font-black shadow-lg hover:scale-105 transition-transform"
            >
              Browse Catalog →
            </Link>
          </div>
        </div>
      )}

      {/* ── 3. KYC Status Notice ───────────────────────────────────────────── */}
      {reseller?.kyc_status === "verified" ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
              <FiCheckCircle size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900 flex items-center gap-2">
                🎉 Account KYC Verified & Completed!
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase">Verified Partner</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                Your business identity documents have been approved by Admin. Wholesale ordering & sub-account onboarding are 100% unlocked!
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-200/80 text-emerald-900 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 border border-emerald-300">
            <FiCheckCircle size={16} className="text-emerald-700" /> Account Verified & Active
          </div>
        </div>
      ) : reseller?.kyc_status === "submitted" ? (
        <div className="p-6 rounded-2xl bg-blue-50 border-2 border-blue-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
              <FiClock size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900">KYC Submitted — Pending Admin Review</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Your documents have been submitted successfully. Admin team is reviewing your application.</div>
            </div>
          </div>
          <Link to="/kyc" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer">
            Track Application Status →
          </Link>
        </div>
      ) : reseller?.kyc_status === "resubmission_required" || reseller?.kyc_status === "rejected" ? (
        <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/30">
              <FiAlertCircle size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900">Action Required: KYC Corrections Needed</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Admin requested corrections on your submitted documents. Please re-upload updated files.</div>
            </div>
          </div>
          <Link to="/kyc" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer">
            Re-upload Documents →
          </Link>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <FiAlertCircle size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900">KYC Verification Required</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Please upload your mandatory GST and PAN verification documents to unlock sub-account onboarding.</div>
            </div>
          </div>
          <Link to="/kyc" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer">
            Complete KYC Now →
          </Link>
        </div>
      )}

      {/* ── 4. Key Performance Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FiArrowUpRight size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Earned</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{(0).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FiUsers size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">My EPC Buyers</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{buyers.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <FiPackage size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">KYC Status</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1 capitalize flex items-center gap-1.5">
              {reseller?.kyc_status === 'verified' ? (
                <span className="text-emerald-600 flex items-center gap-1"><FiCheckCircle size={18} /> Verified</span>
              ) : (
                <span className="text-amber-600">{reseller?.kyc_status || 'Draft'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Media Slider Section (Banners / Product Highlights) ─────────── */}
      {sliderItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Industry Highlights & Featured Kits
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {selectedIndustry?.name}
            </span>
          </div>
          <MediaSlider items={sliderItems} autoPlayInterval={6000} />
        </div>
      )}

      {/* ── 6. Explainer Videos Section ────────────────────────────────────── */}
      {explainerVideos.length > 0 && (
        <ExplainerVideoSection items={explainerVideos} />
      )}

      {/* ── 7. Promotional / Announcement Cards ────────────────────────────── */}
      {promotionalCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotionalCards.map((card) => (
            <div
              key={card.id || card._id}
              className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl relative overflow-hidden shadow-md flex flex-col justify-between"
            >
              <div className="space-y-2 relative z-10">
                <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-black tracking-wider uppercase inline-block">
                  Special Offer
                </span>
                <h4 className="text-xl font-black">{card.heading || card.title}</h4>
                {card.short_description && (
                  <p className="text-xs text-white/80 leading-relaxed max-w-md">{card.short_description}</p>
                )}
              </div>
              {card.cta_label && (
                <div className="mt-4 relative z-10">
                  <a
                    href={card.cta_url || "#"}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                  >
                    {card.cta_label} →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 8. Related Products for Selected Industry ──────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FiShoppingBag size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {selectedIndustry ? `${selectedIndustry.name} Solar Products` : "Related Products"}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Authorized wholesale pricing and turnkey solutions
              </p>
            </div>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View Full Catalog →
          </Link>
        </div>

        {loadingProducts && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id || p._id}
                className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      SKU: {p.sku_code || "N/A"}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      In Stock
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm line-clamp-2">
                    {p.name}
                  </h4>
                  {p.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Base Price</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      ₹{((p.base_price_paise || 0) / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <Link
                    to="/catalog"
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ContentEmptyState
            icon={FiShoppingBag}
            title={`No products listed for ${selectedIndustry?.name || 'this industry'}`}
            message="Wholesale products matching this industry category will appear here once configured."
            compact
          />
        )}
      </div>

    </div>
  );
}
