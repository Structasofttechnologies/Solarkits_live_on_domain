import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHelpCircle,
  FiChevronDown,
  FiSend,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";

const FAQS = [
  {
    q: "Is GST registration mandatory to become an authorized franchisee?",
    a: "Yes. Because SolarKits provides B2B factory-gate pricing with full 18%/12% GST Input Tax Credit (ITC), a valid GSTIN number is required during digital onboarding.",
  },
  {
    q: "What is the upfront investment required to start?",
    a: "You can start with zero upfront capital under the Commission Starter Plan (Free/Promo). For established distributors wanting direct stock holding and maximum wholesale margins, the Dealer Starter Plan is only ₹5,000 / year.",
  },
  {
    q: "How does territory exclusivity work in my district?",
    a: "Your allotted revenue districts (minimum 2 districts per plan) are registered on our central platform. Local rooftop customer leads and commercial EPC inquiries originating in your district are routed directly into your franchisee portal.",
  },
  {
    q: "How and when do I receive commission and profit payouts?",
    a: "Payouts are automated via the Franchisee Digital Wallet. As soon as an order is fulfilled or dispatched, your commission is credited (T+0) and can be withdrawn directly to your registered bank account.",
  },
  {
    q: "How is equipment warranty and technical support handled?",
    a: "All equipment comes with direct manufacturer warranties (5 to 10 years for Inverters, 25 to 30 years for Tier-1 Solar Modules). SolarKits provides technical SLD engineering support and fast regional replacement services.",
  },
];

export default function FaqContactSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    state: "",
    district: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: "",
        mobile: "",
        email: "",
        state: "",
        district: "",
        message: "",
      });
    }, 1000);
  };

  return (
    <section id="contact" className="py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: FAQ Accordion */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-100 shadow-xs">
                <FiHelpCircle className="text-[#0575B8]" size={14} />
                <span className="text-xs font-black uppercase tracking-wider text-[#0575B8]">
                  Frequently Asked Questions
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Everything You Need to Know About the{" "}
                <span className="text-[#F49222]">
                  Franchise Portal
                </span>
              </h2>
            </div>

            {/* Accordion */}
            <div className="space-y-3 pt-4">
              {FAQS.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-[#0575B8] transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <FiChevronDown
                        className={`text-slate-400 transition-transform duration-300 shrink-0 ${
                          isOpen ? "rotate-180 text-[#0575B8]" : ""
                        }`}
                        size={18}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-200/80 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Callback & Inquiry Form */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-7 sm:p-8 shadow-lg space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Request Franchise Consultation</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Have specific queries about multi-district or state distribution? Our partner team will call you within 2 hours.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <FiCheckCircle className="mx-auto text-emerald-600" size={36} />
                  <h4 className="text-base font-bold text-slate-900">Inquiry Received Successfully!</h4>
                  <p className="text-xs text-slate-600">
                    A SolarKits Franchise Director has been assigned to your request and will contact you shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-[#0575B8] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Full Name / Contact Person
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8] shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="9876543210"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rajesh@company.com"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Target District
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder="e.g. Pune"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Business Details / Expected Volume
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your current solar installation or electrical business..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8] shadow-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" size={16} />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <FiSend size={16} />
                        <span>Request Callback Now</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
