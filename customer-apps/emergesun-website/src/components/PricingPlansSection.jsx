import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function PricingPlansSection() {
  const [sectionInfo, setSectionInfo] = useState({
    sectionTitle: 'Flexible Pricing Plans',
    sectionSubtitle: 'Choose the plan that fits your solar business needs',
    sectionStatus: true,
  });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/pricing-plans/get?activeOnly=true&t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          if (data.section) {
            setSectionInfo(data.section);
          }
          if (data.plans) {
            setPlans(data.plans);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch pricing plans configuration:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-gradient-to-br from-blue-50/30 via-white to-orange-50/30 px-6 py-24 md:px-12 lg:px-20 border-t border-gray-100 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <Icons.Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
          <p className="text-gray-500 font-semibold">Loading pricing plans...</p>
        </div>
      </section>
    );
  }

  if (!sectionInfo.sectionStatus) {
    return null; // Do not render section if disabled
  }

  return (
    <section className="w-full bg-gradient-to-br from-blue-50/30 via-white to-orange-50/30 px-6 py-24 md:px-12 lg:px-20 border-t border-gray-100">
      <div className="mx-auto max-w-[1440px] text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          {sectionInfo.sectionTitle}
        </h2>
        <p className="mt-4 text-lg text-gray-500">
          {sectionInfo.sectionSubtitle}
        </p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-full mx-auto">
          {plans.map((plan, idx) => {
            const isPopularCard = plan.isPopular;
            const shadowStyle = isPopularCard
              ? {
                  boxShadow: `0 0 0 4px ${plan.cardBorderColor}33, 0 10px 15px -3px rgba(0, 0, 0, 0.1)`,
                }
              : {};

            const cardStyle = {
              backgroundColor: plan.cardBackgroundColor || '#ffffff',
              borderColor: plan.cardBorderColor || '#e5e7eb',
              ...shadowStyle,
            };

            return (
              <motion.div
                key={plan._id || idx}
                whileHover={{ y: -8, scale: 1.01 }}
                className={`relative rounded-3xl p-4 text-left border shadow-lg hover:shadow-2xl transition-all duration-300 w-full flex flex-col justify-between ${
                  isPopularCard ? 'ring-4' : ''
                }`}
                style={cardStyle}
              >
                {/* Popular Badge */}
                {isPopularCard && plan.badgeStatus && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-extrabold tracking-wider uppercase shadow-md whitespace-nowrap"
                    style={{
                      backgroundColor: plan.badgeBackgroundColor || '#a855f7',
                      color: plan.badgeTextColor || '#ffffff',
                    }}
                  >
                    {plan.badgeText || 'Most Popular'}
                  </div>
                )}

                <div>
                  {/* Plan Top Section */}
                  <div className="text-center pb-6 border-b border-gray-100">
                    <h3
                      className="text-xl font-black"
                      style={{ color: plan.planTitleColor || '#1f2937' }}
                    >
                      {plan.planName}
                    </h3>
                    <div className="mt-3 flex items-baseline justify-center">
                      <span
                        className="text-3xl font-black tracking-tight"
                        style={{ color: plan.priceColor || '#1f2937' }}
                      >
                        {plan.price}
                      </span>
                      {plan.duration && (
                        <span className="ml-1 text-sm font-semibold text-gray-400">
                          /{plan.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan Features Section */}
                  <div className="py-6">
                    <span
                      className="text-sm font-extrabold uppercase tracking-wider"
                      style={{ color: plan.featureHeadingColor || '#1f2937' }}
                    >
                      {plan.featureSectionTitle || 'Features'}
                    </span>
                    <ul className="mt-4 space-y-3">
                      {plan.features
                        ?.filter((feat) => feat.status !== false)
                        ?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        ?.map((feat, fidx) => {
                          const IconComp = Icons[feat.icon] || Icons.CheckCircle;
                          return (
                            <li key={fidx} className="flex items-start gap-2.5">
                              <IconComp
                                className="h-4 w-4 flex-shrink-0 mt-0.5"
                                style={{ color: plan.planTitleColor || '#10b981' }}
                              />
                              <span
                                className="text-xs font-medium leading-normal"
                                style={{ color: plan.featureTextColor || '#4b5563' }}
                              >
                                {feat.title}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </div>

                <div>
                  {/* Solar Software Included Box */}
                  {plan.softwareIncluded && plan.softwareIncluded.length > 0 && (
                    <div
                      className="mb-6 rounded-2xl p-3"
                      style={{
                        backgroundColor: `${plan.softwareHeadingColor || '#ea580c'}0d`,
                        border: `1px solid ${plan.softwareHeadingColor || '#ea580c'}26`,
                      }}
                    >
                      <div
                        className="flex items-start gap-1.5 text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: plan.softwareHeadingColor || '#ea580c' }}
                      >
                        <Icons.Sun
                          className="h-4 w-4 animate-spin-slow flex-shrink-0 mt-0.5"
                          style={{ color: plan.softwareHeadingColor || '#ea580c' }}
                        />
                        <span>{plan.softwareSectionTitle || 'Solar Software Included'}</span>
                      </div>
                      <ul className="space-y-1">
                        {plan.softwareIncluded
                          ?.filter((sw) => sw.status !== false)
                          ?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                          ?.map((sw, sidx) => {
                            const SwIconComp = Icons[sw.icon] || Icons.Sun;
                            return (
                              <li
                                key={sidx}
                                className="text-xs font-semibold flex items-start gap-1.5"
                                style={{ color: plan.softwareTextColor || '#4b5563' }}
                              >
                                <SwIconComp
                                  className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
                                  style={{ color: plan.softwareHeadingColor || '#ea580c' }}
                                />
                                <span className="leading-tight">{sw.title}</span>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}

                  {/* Button */}
                  <Link
                    to={plan.buttonLink || '/login'}
                    className="block w-full text-center py-4 rounded-2xl font-bold transition-all shadow-md active:scale-[0.98]"
                    style={{
                      backgroundColor: plan.buttonBackgroundColor || '#2563eb',
                      color: plan.buttonTextColor || '#ffffff',
                      boxShadow: `0 4px 6px -1px ${plan.buttonBackgroundColor || '#2563eb'}33`,
                    }}
                  >
                    {plan.buttonText || 'Get Started'}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

