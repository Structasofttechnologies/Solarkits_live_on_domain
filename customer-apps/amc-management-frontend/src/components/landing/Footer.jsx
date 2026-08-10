// src/components/landing/Footer.jsx
import { Link } from 'react-router-dom';
import { Sun, Mail, Phone, MapPin, ArrowUpRight, Shield } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-navy text-navy-300 pt-16 pb-12 border-t border-navy-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-navy-700">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-solar flex items-center justify-center text-navy-900 shadow-md">
                <Sun className="w-6 h-6 text-navy-900" />
              </div>
              <div>
                <span className="font-bold text-xl text-white tracking-tight">Emergesun</span>
                <span className="ml-2 text-xs bg-solar/20 text-solar font-semibold px-2 py-0.5 rounded-full border border-solar/30">
                  AMC Cloud
                </span>
                <p className="text-xxs text-navy-300 font-medium">SOLAR LIFECYCLE MANAGEMENT ERP</p>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-navy-300 max-w-sm">
              India's premier AMC & Operations Management Platform built specifically for Solar EPCs, O&M contractors, and rooftop installers. Streamlining solar cleaning cycles, breakdown tickets, technician dispatch, and client renewals.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/login"
                className="text-xs font-bold text-navy-900 bg-solar hover:bg-solar-600 px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                Sign In to ERP Portal
              </Link>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform Features
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#features" className="hover:text-solar transition-colors">AMC Plan Management</a></li>
              <li><a href="#features" className="hover:text-solar transition-colors">Service Scheduling</a></li>
              <li><a href="#features" className="hover:text-solar transition-colors">Technician GPS App</a></li>
              <li><a href="#features" className="hover:text-solar transition-colors">Complaint & SLA Desk</a></li>
              <li><a href="#features" className="hover:text-solar transition-colors">Maintenance History Logs</a></li>
              <li><a href="#features" className="hover:text-solar transition-colors">Solar PR Yield Analytics</a></li>
            </ul>
          </div>

          {/* Solar AMC Solutions */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Solar Solutions
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#solar-benefits" className="hover:text-solar transition-colors">Residential Solar AMCs</a></li>
              <li><a href="#solar-benefits" className="hover:text-solar transition-colors">Commercial Rooftop Operations</a></li>
              <li><a href="#solar-benefits" className="hover:text-solar transition-colors">MW Utility Scale O&M</a></li>
              <li><a href="#plans" className="hover:text-solar transition-colors">Panel Washing Cycles</a></li>
              <li><a href="#plans" className="hover:text-solar transition-colors">Inverter Preventive Maintenance</a></li>
              <li><a href="#plans" className="hover:text-solar transition-colors">Contract Renewal Workflows</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-solar shrink-0 mt-0.5" />
                <span>Solar Hub, SG Highway, Ahmedabad, Gujarat 380054</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-solar shrink-0" />
                <span>+91 (800) 456-7890</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-solar shrink-0" />
                <span>amc-support@emergesun.com</span>
              </li>
              <li className="pt-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                <span className="text-xxs text-navy-200">ISO 27001 & GDPR Compliant</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xxs text-navy-400 font-medium">
          <p>© {new Date().getFullYear()} Emergesun AMC Cloud. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#faq" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#faq" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#faq" className="hover:text-white transition-colors">SLA Commitment</a>
            <button onClick={scrollToTop} className="text-solar hover:underline flex items-center gap-1 font-bold">
              <span>Back to top</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
