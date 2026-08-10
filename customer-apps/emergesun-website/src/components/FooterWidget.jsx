import { useState, useEffect } from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function FooterWidget() {
  const currentYear = new Date().getFullYear();

  const [footerConfig, setFooterConfig] = useState({
    brandName: 'EmergeSun',
    tagline: 'Your partner in sustainable energy since 2020.',
    quickLinksTitle: 'Quick Links',
    quickLinks: [
      { id: 'q-1', label: 'Services', url: '/services' },
      { id: 'q-2', label: 'About Us', url: '/about' },
      { id: 'q-3', label: 'Contact', url: '/contact' },
      { id: 'q-4', label: 'FAQ', url: '/faq' },
    ],
    contactTitle: 'Contact',
    address: '123 Solar Ave, Green City, 45678',
    email: 'info@solarsolutions.com',
    phone: '+91 98765 43210',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    twitterUrl: 'https://twitter.com',
    linkedinUrl: 'https://linkedin.com',
    copyrightText: `© ${currentYear} Solar Solutions. All rights reserved.`,
    status: true,
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/footer/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setFooterConfig((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch footer config:', err);
      });
  }, []);

  if (footerConfig.status === false) {
    return null;
  }

  const socialLinks = [
    { name: 'Facebook', url: footerConfig.facebookUrl, icon: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
    { name: 'Instagram', url: footerConfig.instagramUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' },
    { name: 'Twitter', url: footerConfig.twitterUrl, icon: 'https://cdn-icons-png.flaticon.com/512/124/124021.png' },
    { name: 'LinkedIn', url: footerConfig.linkedinUrl, icon: 'https://cdn-icons-png.flaticon.com/512/174/174857.png' },
  ].filter((item) => Boolean(item.url));

  return (
    <footer className="relative w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-6 py-12 text-white md:px-12 lg:px-20 border-t border-white/5 overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-50%] left-[-10%] w-[300px] h-[300px] rounded-full bg-blue-700/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-orange/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid gap-10 md:grid-cols-5">
          
          {/* Company Info */}
          <div className="md:col-span-2 flex flex-col space-y-5">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt={footerConfig.brandName || "EmergeSun"} 
                className="h-11 w-auto object-contain brightness-0 invert transition-transform duration-300 hover:scale-[1.02]" 
              />
            </div>
            <p className="text-sm leading-relaxed text-slate-400 font-light max-w-md">
              {footerConfig.tagline || 'Your partner in sustainable energy since 2020.'}
            </p>
            {/* Social Icons */}
            {socialLinks.length > 0 && (
              <div className="flex space-x-3 pt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white hover:bg-orange p-2 hover:scale-110 hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-orange/20"
                  >
                    <img
                      src={social.icon}
                      alt={social.name}
                      className="h-5 w-5 object-contain"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links Section */}
          <div className="md:col-span-1 flex flex-col space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white relative after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-6 after:h-[2px] after:bg-orange">
              {footerConfig.quickLinksTitle || 'Quick Links'}
            </h3>
            <ul className="space-y-3 text-sm text-slate-400 pt-2">
              {(footerConfig.quickLinks && footerConfig.quickLinks.length > 0
                ? footerConfig.quickLinks
                : [
                    { id: 'q-1', label: 'Services', url: '/services' },
                    { id: 'q-2', label: 'About Us', url: '/about' },
                    { id: 'q-3', label: 'Contact', url: '/contact' },
                    { id: 'q-4', label: 'FAQ', url: '/faq' },
                  ]
              ).map((link, idx) => (
                <li key={link.id || idx}>
                  <a 
                    href={link.url || '#'} 
                    className="hover:text-orange hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info Section */}
          <div className="md:col-span-2 flex flex-col space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white relative after:content-[''] after:absolute after:bottom-[-6px] after:left-0 after:w-6 after:h-[2px] after:bg-orange">
              {footerConfig.contactTitle || 'Contact'}
            </h3>
            <div className="space-y-4 text-sm text-slate-400 pt-2">
              {footerConfig.address && (
                <div className="flex items-start space-x-3 group">
                  <MapPin className="h-5 w-5 text-orange flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <span className="group-hover:text-slate-200 transition-colors duration-300 leading-relaxed">{footerConfig.address}</span>
                </div>
              )}
              {footerConfig.email && (
                <div className="flex items-center space-x-3 group">
                  <Mail className="h-5 w-5 text-orange flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <a 
                    href={`mailto:${footerConfig.email}`} 
                    className="group-hover:text-slate-200 hover:text-white hover:underline transition-colors duration-300"
                  >
                    {footerConfig.email}
                  </a>
                </div>
              )}
              {footerConfig.phone && (
                <div className="flex items-center space-x-3 group">
                  <Phone className="h-5 w-5 text-orange flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <a 
                    href={`tel:${footerConfig.phone}`} 
                    className="group-hover:text-slate-200 hover:text-white hover:underline transition-colors duration-300"
                  >
                    {footerConfig.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent my-8" />

        {/* Footer Bottom */}
        <div className="text-center text-xs text-slate-500 font-medium tracking-wide">
          {footerConfig.copyrightText || `© ${currentYear} Solar Solutions. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
