import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Leaf, Droplet, ShieldCheck, Heart, Play, ArrowRight, Tractor, Factory, Award, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-[#110A03] overflow-hidden flex flex-col justify-between pt-32 pb-10">
      
      {/* Background Image & Overlay */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/assets/hero_bottle_elegant_font.png")' }}
        />
        {/* Gradients to blend text & edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0702] via-[#0d0702]/80 to-transparent w-full md:w-2/3" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0702] via-transparent to-transparent h-full" />
      </motion.div>

      {/* Floating Particles over Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-mustard-400 blur-[1px]"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -100],
              x: [0, Math.random() * 50 - 25],
              opacity: [0, Math.random() * 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 10
            }}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-6 lg:px-12 relative z-10 flex-1 flex flex-col justify-center py-10 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start gap-8 max-w-2xl"
          >
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mustard-500/30 bg-black/40 backdrop-blur-sm">
              <Leaf className="w-4 h-4 text-mustard-500" />
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-slate-200 uppercase">100% PURE • COLD PRESSED • CHEMICAL FREE</span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-black text-white leading-[1.05] tracking-tight drop-shadow-2xl">
              Liquid Gold <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mustard-400 to-mustard-600">From Agra</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed max-w-lg">
              Premium quality mustard oil extracted from the finest seeds, crafted with purity, tradition, and trust.
            </p>

            {/* Feature Icons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              {[
                { icon: Leaf, title: "100% Pure", sub: "No Additives" },
                { icon: Droplet, title: "Cold Pressed", sub: "Maximum Nutrition" },
                { icon: ShieldCheck, title: "Trusted Quality", sub: "Lab Tested" },
                { icon: Heart, title: "Healthy Choice", sub: "For Your Family" }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-full border border-mustard-500/40 flex items-center justify-center bg-mustard-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <feature.icon className="w-5 h-5 text-mustard-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">{feature.title}</h4>
                    <p className="text-[10px] text-slate-400">{feature.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
              <Link 
                to="/shop" 
                className="px-8 py-4 bg-mustard-500 hover:bg-mustard-400 text-slate-900 font-bold rounded-full transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 interactive"
              >
                Shop Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/about" 
                className="px-8 py-4 border border-white/30 hover:bg-white/10 text-white font-bold rounded-full transition-all flex items-center justify-center gap-3 interactive"
              >
                Our Story <Play className="w-4 h-4 fill-white" />
              </Link>
            </div>
          </motion.div>

          {/* Right Content - Badges overlaid on image */}
          <div className="hidden lg:block relative h-full w-full pointer-events-none">
             <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-6">
                {[
                  { icon: Leaf, text: "Pure\nNatural" },
                  { icon: Droplet, text: "Cold\nPressed" },
                  { icon: Heart, text: "Rich in\nNutrition" }
                ].map((badge, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (i * 0.2), ease: "easeOut" }}
                    className="flex flex-col items-center justify-center gap-2 w-24 h-28 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-2xl"
                  >
                    <badge.icon className="w-6 h-6 text-mustard-500" />
                    <span className="text-[10px] text-white font-medium text-center leading-tight whitespace-pre-line">{badge.text}</span>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Trust Cards Section (Bottom Banner) */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="container mx-auto px-6 lg:px-12 relative z-20 mt-10 lg:mt-16"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-gradient-to-r from-[#21160C]/90 to-[#1A1009]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          {[
            { icon: Tractor, title: "Farm Fresh", sub: "Sourced Directly" },
            { icon: Factory, title: "Traditional Process", sub: "Wooden Cold Pressed" },
            { icon: Award, title: "Quality Assured", sub: "Lab Tested & Certified" },
            { icon: MapPin, title: "Made in India", sub: "Proudly Indian", extra: "🇮🇳" }
          ].map((trust, i) => (
            <div key={i} className="flex items-center gap-4 p-2 sm:p-4 border-b sm:border-b-0 sm:border-r border-white/5 last:border-0 last:pb-2">
              <trust.icon className="w-8 h-8 text-mustard-500 shrink-0" />
              <div className="flex flex-col">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  {trust.title} {trust.extra && <span className="text-base">{trust.extra}</span>}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{trust.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default Hero;
