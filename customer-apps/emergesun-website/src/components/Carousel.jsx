import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Carousel({
  items = [],
  renderItem,
  autoPlayInterval = 3000,
  showIndicators = true,
  className = ""
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [items.length, autoPlayInterval]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={`relative w-full flex flex-col items-center overflow-hidden ${className}`}>
      
      {/* Slides Container */}
      <div className="relative flex w-full justify-center items-center h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full max-w-4xl"
          >
            {renderItem(items[currentIndex], currentIndex)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="mt-4 flex items-center justify-center space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? "w-6 bg-orange"
                  : "w-3 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
