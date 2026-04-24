import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const Testimonials = () => {
  const [current, setCurrent] = useState(0);

  const testimonials = [
    {
      text: "The pungent aroma of KC Traders' mustard oil takes me straight back to my grandmother's village cooking. It's the only brand I trust for authenticity.",
      author: "Rajesh S.",
      role: "Home Chef"
    },
    {
      text: "As a restaurant owner, I need consistency and quality. This oil has a fantastic smoke point and gives our curries that perfect traditional golden hue.",
      author: "Priya M.",
      role: "Restaurant Owner"
    },
    {
      text: "Pure, unadulterated, and packaged perfectly. knowing it's sourced directly from Agra's farmers gives me confidence in what I feed my family.",
      author: "Anil K.",
      role: "Health Enthusiast"
    }
  ];

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 bg-mustard-600 text-white relative overflow-hidden">
      {/* Decorative quotes */}
      <div className="absolute top-10 left-10 opacity-10">
        <Quote className="w-48 h-48" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold">What Our Customers Say</h2>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center px-4 md:px-12"
            >
              <p className="text-xl md:text-3xl font-medium leading-relaxed mb-10 text-white/90">
                "{testimonials[current].text}"
              </p>
              <div>
                <h4 className="text-xl font-bold">{testimonials[current].author}</h4>
                <p className="text-mustard-200">{testimonials[current].role}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-4 mt-12">
            <button 
              onClick={prev}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-sm interactive"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={next}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-sm interactive"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
