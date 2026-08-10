// src/components/landing/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Menu, X, ArrowRight } from 'lucide-react';

const navLinks = [
  { name: 'Why Us', href: '#why-us' },
  { name: 'Features', href: '#features' },
  { name: 'Solar Benefits', href: '#solar-benefits' },
  { name: 'EPC Plans', href: '#plans' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-card border-b border-border/60 py-3'
          : 'bg-white/80 backdrop-blur-sm py-4 border-b border-navy-100/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-md group-hover:bg-navy-700 transition-colors">
              <Sun className="w-5 h-5 text-solar animate-pulse-soft" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-navy tracking-tight">Emergesun</span>
                <span className="text-xs bg-solar/15 text-solar-900 border border-solar/30 font-semibold px-2 py-0.5 rounded-full">
                  AMC Cloud
                </span>
              </div>
              <p className="text-xxs text-text-secondary font-medium tracking-wide">
                SOLAR AMC MANAGEMENT ERP
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-xs font-semibold text-text-secondary hover:text-navy px-3 py-2 rounded-lg hover:bg-navy-50/60 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-navy hover:text-navy-700 px-4 py-2 rounded-lg hover:bg-navy-50 border border-navy-200 transition-all"
            >
              Sign In
            </Link>
            <a
              href="#plans"
              onClick={(e) => handleNavClick(e, '#plans')}
              className="inline-flex items-center gap-2 text-xs font-bold text-navy-900 bg-solar hover:bg-solar-600 px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-semibold text-navy bg-navy-50 px-3 py-1.5 rounded-md border border-navy-200"
            >
              Login
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-navy hover:bg-navy-50"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-border px-4 pt-3 pb-6 space-y-3 shadow-xl animate-fade-in">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium text-text-primary hover:text-navy px-3 py-2 rounded-md hover:bg-navy-50"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center text-sm font-semibold text-navy py-2.5 rounded-lg border border-navy-200 bg-navy-50"
            >
              Log in to ERP
            </Link>
            <a
              href="#plans"
              onClick={(e) => handleNavClick(e, '#plans')}
              className="w-full text-center text-sm font-bold text-navy-900 bg-solar py-2.5 rounded-lg shadow-md"
            >
              Get Started Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
