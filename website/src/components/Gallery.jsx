import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

const Gallery = () => {
  const [selectedImg, setSelectedImg] = useState(null);

  // 5 Images tailored for a bento-box 1 big, 4 small grid
  const images = [
    { src: "/assets/hero_bg.png", alt: "Golden Mustard Fields", className: "md:col-span-2 md:row-span-2" },
    { src: "/assets/product_oil.png", alt: "Premium Mustard Oil Bottle", className: "md:col-span-1 md:row-span-1" },
    { src: "/assets/mustard_seeds.png", alt: "Rich Mustard Seeds", className: "md:col-span-1 md:row-span-1" },
    { src: "/assets/product_filtered.png", alt: "Clear Filtered Oil", className: "md:col-span-1 md:row-span-1" },
    { src: "/assets/hero_bg.png", alt: "Beautiful Setup", className: "md:col-span-1 md:row-span-1" }
  ];

  return (
    <section id="gallery" className="py-24 bg-white dark:bg-[#1a120c]">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Glimpse of <span className="text-gradient">Our World</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            From the vibrant golden fields of Agra directly to our state-of-the-art packaging.
          </p>
        </div>

        {/* Bento Box Collage Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[600px]">
          {images.map((img, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative group overflow-hidden rounded-3xl cursor-pointer ${img.className} h-64 md:h-auto interactive shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-white/5`}
              onClick={() => setSelectedImg(img.src)}
            >
              <img 
                src={img.src} 
                alt={img.alt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-mustard-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <ZoomIn className="text-white w-10 h-10 transform scale-50 group-hover:scale-100 transition-transform duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImg(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImg} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              alt="Expanded view" 
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
