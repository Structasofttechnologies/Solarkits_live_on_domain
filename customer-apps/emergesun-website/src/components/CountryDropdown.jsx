import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const countries = [
  { code: 'IND', name: 'India', flag: '🇮🇳' },
  { code: 'USA', name: 'USA', flag: '🇺🇸' },
  { code: 'GBR', name: 'UK', flag: '🇬🇧' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
];

export default function CountryDropdown({ isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(countries[0]);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country) => {
    setSelected(country);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="w-full px-2" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between text-base font-bold text-gray-700 hover:text-primary py-2 text-left animate-none border-0 bg-transparent focus:outline-none"
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">{selected.flag}</span>
            <span>{selected.name} ({selected.code})</span>
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pl-4 border-l-2 border-gray-200 space-y-1 py-1 overflow-hidden"
            >
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleSelect(country)}
                  className={`flex w-full items-center space-x-3 text-sm font-semibold py-2 px-2 rounded-lg text-left transition-colors border-0 bg-transparent focus:outline-none ${
                    selected.code === country.code
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-base font-bold text-gray-700 hover:text-primary transition-colors focus:outline-none py-2 px-3 rounded-xl hover:bg-gray-100/70"
      >
        <span className="text-lg">{selected.flag}</span>
        <span className="text-sm uppercase tracking-wide">{selected.code}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 rounded-xl bg-white/95 backdrop-blur-md py-2 shadow-xl ring-1 ring-black/5 border border-gray-150 z-50 overflow-hidden"
          >
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className={`flex w-[calc(100%-16px)] mx-2 items-center space-x-3 px-3 py-2 text-sm font-bold rounded-lg transition-all text-left border-0 bg-transparent focus:outline-none ${
                  selected.code === country.code
                    ? 'bg-gradient-to-r from-primary/10 to-orange/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span>{country.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
