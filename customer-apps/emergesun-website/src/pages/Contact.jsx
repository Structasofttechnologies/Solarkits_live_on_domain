import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const Facebook = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Twitter = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Instagram = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [successOpen, setSuccessOpen] = useState(false);

  const [contactConfig, setContactConfig] = useState({
    heroTitle: 'Get In Touch',
    heroSubtitle: "We're here to help you with all your solar energy needs. Contact us for free consultations and quotes.",
    sectionTitle: 'Contact Information',
    sectionDesc: 'Fill out the form or reach out to us through any of the channels below. Our team is ready to assist you with your solar journey.',
    officeAddress: '123 Solar Street, Green City, GC 12345, United States',
    phone1: '+1 (555) 123-4567',
    phone2: '+1 (555) 765-4321',
    email1: 'info@solarcompany.com',
    email2: 'support@solarcompany.com',
    businessHours: 'Monday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed',
    facebookUrl: 'https://facebook.com',
    twitterUrl: 'https://twitter.com',
    linkedinUrl: 'https://linkedin.com',
    instagramUrl: 'https://instagram.com',
    formTitle: 'Send us a Message',
    submitBtnText: 'Submit Message',
    mapTitle: 'Map View',
    mapSubtitle: 'Interactive map integrations will load in this canvas',
    mapStatus: true,
    faqTitle: 'Frequently Asked Questions',
    faqStatus: true,
    faqs: [
      { q: 'How long does a solar installation take?', a: 'Residential installations typically take 2-4 days, while commercial projects vary depending on scale and planning compliance.' },
      { q: 'What is the lifespan of solar panels?', a: 'High-quality solar panels have an active lifespan of 25-30 years, often with linear power warranties up to 25 years.' },
      { q: 'Do you offer solar warranties?', a: 'Yes! We offer a full workmanship warranty alongside standard manufacture product warranties for materials, inverters, and battery banks.' },
      { q: 'How can I calculate my ROI?', a: 'Our consultants will analyze your billing, property size, and sun exposure profile to calculate a accurate ROI payoff schedule.' }
    ],
    status: true
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/contact/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setContactConfig((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch contact config:', err);
      });
  }, []);

  const phonesText = [contactConfig.phone1, contactConfig.phone2].filter(Boolean).join('\n');
  const emailsText = [contactConfig.email1, contactConfig.email2].filter(Boolean).join('\n');

  const contactInfo = [
    { icon: MapPin, title: 'Our Office', content: contactConfig.officeAddress || '123 Solar Street, Green City' },
    { icon: Phone, title: 'Phone Number', content: phonesText || '+1 (555) 123-4567' },
    { icon: Mail, title: 'Email Address', content: emailsText || 'info@solarcompany.com' },
    { icon: Clock, title: 'Business Hours', content: contactConfig.businessHours || 'Monday - Friday: 8:00 AM - 6:00 PM' }
  ];

  const socialLinks = [
    { icon: Facebook, url: contactConfig.facebookUrl },
    { icon: Twitter, url: contactConfig.twitterUrl },
    { icon: Linkedin, url: contactConfig.linkedinUrl },
    { icon: Instagram, url: contactConfig.instagramUrl }
  ].filter((item) => Boolean(item.url));

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your name';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.message.trim()) newErrors.message = 'Please enter your message';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted', formData);
      setSuccessOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setSuccessOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-white">
      <SolarHeader />

      <main className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 py-16 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl space-y-20">

          {/* Hero Section */}
          {contactConfig.status !== false && (
            <section className="text-center py-10 bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl p-8 border border-blue-100/50 max-w-5xl mx-auto shadow-sm">
              <h1 className="text-4xl font-extrabold text-gray-900 md:text-5xl leading-tight">
                {contactConfig.heroTitle || 'Get In Touch'}
              </h1>
              {contactConfig.heroSubtitle && (
                <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
                  {contactConfig.heroSubtitle}
                </p>
              )}
            </section>
          )}

          {/* Contact Details & Form Section */}
          {contactConfig.status !== false && (
            <section className="flex flex-col lg:flex-row gap-12 items-start">
              
              {/* Contact Information */}
              <div className="flex-1 space-y-8 text-left w-full">
                <h2 className="text-3xl font-bold text-gray-900">
                  {contactConfig.sectionTitle || 'Contact Information'}
                </h2>
                {contactConfig.sectionDesc && (
                  <p className="text-base text-gray-600 leading-relaxed">
                    {contactConfig.sectionDesc}
                  </p>
                )}
                
                <div className="space-y-6">
                  {contactInfo.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <div key={item.title} className="flex gap-4 items-start">
                        <div className="rounded-full bg-blue-50 p-3 text-blue-700">
                          <IconComp className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                          <p className="mt-1 text-sm text-gray-500 whitespace-pre-line leading-relaxed">{item.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Social links */}
                {socialLinks.length > 0 && (
                  <div className="pt-6">
                    <h4 className="text-base font-bold text-gray-800">Follow Us</h4>
                    <div className="mt-4 flex space-x-3">
                      {socialLinks.map((item, idx) => {
                        const SocialIcon = item.icon;
                        return (
                          <a
                            key={idx}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-100"
                          >
                            <SocialIcon className="h-5 w-5" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <div className="flex-1 w-full rounded-2xl bg-gray-50 border border-gray-200 p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 text-left mb-6">
                  {contactConfig.formTitle || 'Send us a Message'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        className={`w-full rounded-lg border bg-white p-3 text-sm focus:outline-none focus:ring-1 ${
                          errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        className={`w-full rounded-lg border bg-white p-3 text-sm focus:outline-none focus:ring-1 ${
                          errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter message subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <textarea
                      rows="5"
                      className={`w-full rounded-lg border bg-white p-3 text-sm focus:outline-none focus:ring-1 ${
                        errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Tell us about your solar needs..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-500 font-semibold">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 rounded-lg bg-blue-700 py-4 text-base font-bold text-white shadow-md hover:bg-blue-800 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                    <span>{contactConfig.submitBtnText || 'Submit Message'}</span>
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* Map Preview */}
          {contactConfig.mapStatus !== false && (
            <section className="rounded-3xl border border-gray-200 bg-gray-100/50 p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center">
                <MapPin className="h-16 w-16 text-blue-700 mb-4 float-animation" />
                <h3 className="text-xl font-bold text-gray-800">{contactConfig.mapTitle || 'Map View'}</h3>
                <p className="text-sm text-gray-500 mt-2">{contactConfig.mapSubtitle || 'Interactive map integrations will load in this canvas'}</p>
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {contactConfig.faqStatus !== false && (
            <section className="space-y-8 text-left max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center">{contactConfig.faqTitle || 'Frequently Asked Questions'}</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {(contactConfig.faqs || []).map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-800">{faq.q}</h4>
                    <p className="mt-3 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Success Dialog Modal */}
      <AnimatePresence>
        {successOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDialog}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl border border-gray-150"
            >
              <h3 className="text-2xl font-bold text-gray-900">Thank You!</h3>
              <p className="mt-4 text-sm text-gray-600">
                Your message has been sent successfully. We will get back to you soon.
              </p>
              <button
                onClick={handleCloseDialog}
                className="mt-6 rounded-lg bg-blue-700 px-6 py-2 text-sm font-bold text-white hover:bg-blue-800 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FooterWidget />
    </div>
  );
}
