// src/components/landing/FAQSection.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

const faqs = [
  {
    question: 'How does Emergesun AMC Cloud help increase solar panel efficiency?',
    answer: 'Emergesun automates routine cleaning schedules based on regional soiling factors. By ensuring panel washing happens systematically and field technicians upload before/after photos, dust buildup is minimized—restoring 18% to 25% of lost generation capacity.',
  },
  {
    question: 'Can field technicians use the mobile app without internet connectivity?',
    answer: 'Yes! Our technician mobile app has offline mode support. Technicians can check in at remote solar farm locations, log panel washing checklists, capture thermal photos, and record customer signatures offline. Data syncs automatically once back in network range.',
  },
  {
    question: 'Does the ERP system support customized AMC contract templates?',
    answer: 'Absoluted. You can create customized AMC plans with custom washing frequencies (e.g. bi-weekly, monthly), preventive electrical audit schedules, SLA response hours, and inverter warranty coverage clauses.',
  },
  {
    question: 'How are AMC contract renewal reminders dispatched to solar clients?',
    answer: 'The system automatically triggers automated multi-channel notifications (SMS, Email, WhatsApp) starting 30 days prior to contract expiration. Reminders include instant payment links for 1-click online renewal.',
  },
  {
    question: 'How does breakdown complaint tracking work when an inverter trips?',
    answer: 'When a breakdown ticket is logged, the ERP system tags the severity (e.g., Critical for inverter tripping), starts an automated SLA timer, and assigns the closest field technician based on GPS location with automated supervisor escalation if unhandled.',
  },
  {
    question: 'Can we generate branded PDF service reports for our solar clients?',
    answer: 'Yes, after every completed service visit, a branded PDF service certificate is automatically compiled featuring your EPC logo, technician notes, photos, and performance metrics—ready to email or download in 1 click.',
  },
  {
    question: 'How does the ERP integrate with our existing solar monitoring hardware?',
    answer: 'Emergesun offers API integrations with major solar inverter monitoring platforms (Growatt, Solis, Sungrow, Huawei, Enphase) to ingest real-time generation data and trigger fault alarms directly inside the ERP dashboard.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-navy-50 border border-navy-200 rounded-full px-3.5 py-1">
            <span className="text-xs font-bold text-navy tracking-wide uppercase">
              Frequently Asked Questions
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Got Questions About Solar AMC Management?
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Find answers to common questions about platform setup, technician mobile apps, SLA escalation, and client reporting.
          </p>

          {/* Search Input */}
          <div className="pt-2 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQ questions..."
              className="w-full text-xs bg-bg border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/30 transition-all"
            />
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 text-text-secondary text-xs">
              No matching questions found for "{searchQuery}".
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? 'bg-navy-50/40 border-navy-300 shadow-sm'
                      : 'bg-white border-border hover:border-navy-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-navy text-sm sm:text-base"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className={`w-5 h-5 shrink-0 ${isOpen ? 'text-solar-900' : 'text-navy-400'}`} />
                      <span>{faq.question}</span>
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-xs border border-border shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-navy text-white' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-navy-100/50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
