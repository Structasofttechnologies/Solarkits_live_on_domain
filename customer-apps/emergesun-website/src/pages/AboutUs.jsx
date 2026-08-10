import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Eye, Leaf, Sparkles, Users, ShieldCheck, Zap, Heart, Award, Shield } from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';

const ICON_MAP = {
  Flag,
  Eye,
  Leaf,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  Heart,
  Award,
  Shield
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AboutUs() {
  const [aboutData, setAboutData] = useState({
    title: 'About Our Company',
    description:
      'We are committed to providing innovative solar energy solutions that power a sustainable future. With years of expertise in renewable energy, we help homes and businesses transition to clean, reliable solar power.',
    primaryBtnText: 'Get Started',
    secondaryBtnText: 'Learn More',
    imageUrl:
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=1472&q=80',
    status: true,
  });

  const [aboutDetails, setAboutDetails] = useState({
    missionTitle: 'Our Mission',
    missionDescription: 'To make solar energy accessible and affordable for everyone, driving the transition to renewable energy and creating a sustainable future for generations to come.',
    visionTitle: 'Our Vision',
    visionDescription: 'A world powered entirely by renewable energy, where every home and business contributes to a cleaner, greener planet through solar power adoption.',
    storyTitle: 'Our Story',
    storyParagraph1: 'Founded in 2015, our journey began with a simple vision: to make solar energy accessible to all. What started as a small team of passionate engineers has grown into a leading solar solutions provider serving thousands of satisfied customers across the country.',
    storyParagraph2: 'We believe in the power of renewable energy to transform communities and protect our planet. Every solar panel we install brings us one step closer to a sustainable future.',
    valuesTitle: 'Our Values',
    values: [
      { icon: "Leaf", title: "Sustainability", description: "Committed to environmental stewardship" },
      { icon: "Sparkles", title: "Innovation", description: "Pushing boundaries in solar technology" },
      { icon: "Users", title: "Customer First", description: "Your satisfaction is our priority" },
      { icon: "ShieldCheck", title: "Quality", description: "Highest standards in every installation" }
    ],
    stats: [
      { value: "10K+", label: "Installations" },
      { value: "15+", label: "Years Experience" },
      { value: "50MW+", label: "Solar Capacity" },
      { value: "98%", label: "Customer Satisfaction" }
    ],
    ctaTitle: 'Ready to Go Solar?',
    ctaDescription: 'Join thousands of satisfied customers who have made the switch to clean, renewable energy.',
    ctaButtonText: 'Get Free Consultation',
    ctaButtonLink: '/contact',
    ctaStatus: true,
    status: true
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/about-us/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setAboutData(data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch About Us config:', err);
      });

    fetch(`${BASE_URL}/api/website/v1/about-details/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          const details = data.data;
          setAboutDetails(prev => ({
            ...prev,
            ...details,
            values: details.values && details.values.length > 0 ? details.values : prev.values,
            stats: details.stats && details.stats.length > 0 ? details.stats : prev.stats
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch About Details config:', err);
      });
  }, []);



  return (
    <div className="min-h-screen bg-white">
      <SolarHeader />

      <main className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 py-16 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl space-y-20">
          
          {/* Hero Section */}
          {aboutData.status !== false && (
            <section className="flex flex-col lg:flex-row items-center gap-12 text-left">
              <div className="flex-1 space-y-6">
                <h1 className="text-4xl font-extrabold text-gray-900 md:text-5xl leading-tight">
                  {aboutData.title || 'About Our Company'}
                </h1>
                <p className="text-lg leading-relaxed text-gray-700">
                  {aboutData.description}
                </p>
                <div className="flex space-x-4">
                  {aboutData.primaryBtnText && (
                    <button className="rounded-lg bg-blue-700 px-8 py-4 text-base font-bold text-white shadow-md hover:bg-blue-800 transition-colors">
                      {aboutData.primaryBtnText}
                    </button>
                  )}
                  {aboutData.secondaryBtnText && (
                    <button className="rounded-lg border-2 border-blue-700 px-8 py-4 text-base font-bold text-blue-700 hover:bg-blue-50 transition-colors">
                      {aboutData.secondaryBtnText}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 w-full h-[400px] rounded-2xl bg-gray-200 shadow-lg overflow-hidden flex items-center justify-center">
                <img
                  src={
                    aboutData.imageUrl ||
                    'https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=1472&q=80'
                  }
                  alt={aboutData.title || 'About Us'}
                  className="w-full h-full object-cover"
                />
              </div>
            </section>
          )}

          {/* Mission & Vision Section */}
          {aboutDetails.status !== false && (
            <>
              <section className="grid gap-8 md:grid-cols-2">
                {/* Mission Card */}
                <div className="rounded-2xl bg-blue-50/70 border border-blue-100/50 p-10 text-left flex flex-col space-y-4">
                  <Flag className="h-12 w-12 text-blue-700" />
                  <h2 className="text-2xl font-bold text-gray-900">{aboutDetails.missionTitle}</h2>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {aboutDetails.missionDescription}
                  </p>
                </div>

                {/* Vision Card */}
                <div className="rounded-2xl bg-green-50/70 border border-green-100/50 p-10 text-left flex flex-col space-y-4">
                  <Eye className="h-12 w-12 text-blue-700" />
                  <h2 className="text-2xl font-bold text-gray-900">{aboutDetails.visionTitle}</h2>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {aboutDetails.visionDescription}
                  </p>
                </div>
              </section>

              {/* Our Story Section */}
              <section className="text-center max-w-4xl mx-auto space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">{aboutDetails.storyTitle}</h2>
                <div className="mx-auto h-1 w-24 bg-blue-700 rounded-full" />
                <p className="text-lg text-gray-700 leading-relaxed">
                  {aboutDetails.storyParagraph1}
                  {aboutDetails.storyParagraph2 && (
                    <>
                      <br />
                      <br />
                      {aboutDetails.storyParagraph2}
                    </>
                  )}
                </p>
              </section>
            </>
          )}

          {/* Team Section (currently commented/not present in Flutter, we skip or leave out to ensure exact design matching) */}

          {/* Values Section */}
          <section className="text-left space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">{aboutDetails.valuesTitle || 'Our Values'}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(aboutDetails.values || []).map((v, index) => {
                const IconComp = ICON_MAP[v.icon] || Sparkles;
                return (
                  <div key={index} className="rounded-2xl bg-white p-8 flex flex-col items-center text-center space-y-4 shadow-md hover:shadow-xl transition-all duration-300">
                    <IconComp className="h-12 w-12 text-blue-700" />
                    <h3 className="text-xl font-bold text-gray-900">{v.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stats Section */}
          <section className="w-full bg-blue-50 rounded-2xl p-10 flex flex-wrap justify-around gap-8 text-center border border-blue-100 shadow-inner">
            {(aboutDetails.stats || []).map((s, index) => (
              <div key={index} className="space-y-2">
                <span className="block text-4xl font-extrabold text-blue-700 md:text-5xl">{s.value}</span>
                <span className="block text-sm font-semibold text-gray-600">{s.label}</span>
              </div>
            ))}
          </section>

          {/* CTA Section */}
          {aboutDetails.ctaStatus !== false && (
            <section className="text-center space-y-6 max-w-2xl mx-auto py-10">
              <h2 className="text-3xl font-bold text-gray-900">{aboutDetails.ctaTitle || 'Ready to Go Solar?'}</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                {aboutDetails.ctaDescription || 'Join thousands of satisfied customers who have made the switch to clean, renewable energy.'}
              </p>
              {aboutDetails.ctaButtonText && (
                <Link
                  to={aboutDetails.ctaButtonLink || '/contact'}
                  className="rounded-lg bg-blue-700 px-8 py-4 text-lg font-bold text-white shadow-md hover:bg-blue-800 transition-colors inline-block text-center"
                >
                  {aboutDetails.ctaButtonText}
                </Link>
              )}
            </section>
          )}

        </div>
      </main>

      <FooterWidget />
    </div>
  );
}
