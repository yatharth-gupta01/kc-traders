import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 400]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 600]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-earth-dark pt-20">
      {/* Background Image & Overlay */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y: y2 }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: 'url("/assets/hero_bg.png")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-earth-dark/90" />
      </motion.div>

      {/* Floating Oil Drops Particles (Synthetic visual) */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none opacity-30">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-tr from-mustard-500 to-mustard-200 blur-[2px]"
            style={{
               width: Math.random() * 20 + 10 + 'px',
               height: Math.random() * 20 + 10 + 'px',
               left: Math.random() * 100 + '%',
               top: Math.random() * 100 + '%',
               borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%'
            }}
            animate={{
              y: [0, -100],
              x: [0, Math.random() * 40 - 20],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <div className="container relative z-20 px-6 mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-mustard-500 animate-pulse"></span>
          <span className="text-sm font-medium tracking-wide text-white uppercase">Premium Quality from Agra</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 tracking-tight leading-tight max-w-4xl"
        >
          Pure Mustard Oil <br className="hidden md:block" />
          <span className="text-gradient">From the Heart of Agra</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl font-light"
        >
          Experience the authentic taste and golden purity of traditional cold-pressed mustard oil, meticulously crafted in Jarar, Bah.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a href="#products" className="px-8 py-4 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-full transition-colors flex items-center justify-center gap-2 interactive">
            Explore Products
          </a>
          <a href="#contact" className="px-8 py-4 bg-transparent border border-white/30 hover:border-white/80 hover:bg-white/10 text-white rounded-full font-medium transition-all interactive backdrop-blur-sm">
            Contact Us
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        style={{ opacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-white/50 uppercase tracking-widest">Scroll Down</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-mustard-400" />
        </motion.div>
      </motion.div>
      
      {/* Bottom curved transition */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-50 dark:from-earth-dark to-transparent z-20 translate-y-2"></div>
    </section>
  );
};

export default Hero;
