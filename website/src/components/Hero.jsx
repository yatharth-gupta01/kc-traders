import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, Droplets } from 'lucide-react';

const Hero = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Stage 0: Bottle Entrance
  const bottleY = useTransform(scrollYProgress, [0, 0.15], [400, 0]);
  const bottleOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

  // Stage 1: The Pour
  // Stream comes down
  const streamOffset = useTransform(scrollYProgress, [0.1, 0.35], [600, 100]);
  const streamOpacity = useTransform(scrollYProgress, [0, 0.1, 0.6, 0.7], [0, 1, 1, 0]);

  // Stage 2: The Fill
  // Liquid rises inside the bottle mask
  const liquidY = useTransform(scrollYProgress, [0.3, 0.8], [380, 50]);

  // Stage 3: The Cap & Label
  const capY = useTransform(scrollYProgress, [0.8, 0.9], [-30, 0]);
  const capOpacity = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);

  const labelOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);
  const labelScale = useTransform(scrollYProgress, [0.85, 0.95], [0.8, 1]);

  // Typography
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const finalTitleY = useTransform(scrollYProgress, [0.85, 0.95], [50, 0]);
  const finalTitleOpacity = useTransform(scrollYProgress, [0.85, 0.95], [0, 1]);

  // Environmental Effects
  const bgDarken = useTransform(scrollYProgress, [0, 1], ["rgba(35, 23, 16, 0.2)", "rgba(5, 2, 0, 0.9)"]);
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const bottleGlowOpacity = useTransform(scrollYProgress, [0.5, 0.9], [0, 1]);

  return (
    <section ref={containerRef} id="home" className="relative w-full h-[300vh] bg-earth-dark">
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">

        {/* Dynamic Background Image & Overlay */}
        <motion.div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
            style={{ backgroundImage: 'url("/assets/hero_bg.png")' }}
          />
          <motion.div className="absolute inset-0 transition-colors" style={{ backgroundColor: bgDarken }} />
        </motion.div>

        {/* Floating Golden Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-mustard-400 blur-[2px]"
              style={{
                width: Math.random() * 6 + 2 + 'px',
                height: Math.random() * 6 + 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -200],
                opacity: [0, Math.random() * 0.8, 0],
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

        {/* Central Animation Area */}
        <div className="relative z-10 w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center px-6">

          {/* Initial Left Text */}
          <motion.div
            className="absolute inset-x-6 top-32 md:relative md:top-auto flex-1 text-center md:text-left z-30 pointer-events-none"
            style={{ opacity: titleOpacity, y: titleY }}
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-mustard-500/30 mb-8 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-mustard-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></span>
              <span className="text-xs font-bold tracking-[0.2em] text-mustard-400 uppercase">Scroll to Pour</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white mb-6 tracking-tight leading-[1.1] drop-shadow-2xl">
              Liquid Gold <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mustard-400 via-amber-500 to-amber-600">From Agra</span>
            </h1>
          </motion.div>

          {/* Center Bottle Container */}
          <motion.div 
            className="relative w-64 md:w-80 max-w-[40vh] aspect-[1/2] flex justify-center z-20 mt-20 md:mt-0"
            style={{ y: bottleY, opacity: bottleOpacity }}
          >

            {/* Glowing Backdrop for filled bottle */}
            <motion.div
              className="absolute inset-0 bg-mustard-500/20 blur-[100px] rounded-full"
              style={{ opacity: bottleGlowOpacity }}
            />

            {/* SVG Bottle Architecture */}
            <svg
              viewBox="0 0 200 400"
              className="absolute inset-0 w-full h-full drop-shadow-2xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* The Perfect Bottle Shape Mask */}
                <clipPath id="bottleMask">
                  <path d="M 85 40 L 115 40 L 115 80 C 115 110, 150 120, 150 160 L 150 380 C 150 395, 140 400, 100 400 C 60 400, 50 395, 50 380 L 50 160 C 50 120, 85 110, 85 80 Z" />
                </clipPath>

                {/* Liquid Color */}
                <linearGradient id="oilGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="10%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#92400e" />
                </linearGradient>

                {/* Pouring Stream Color */}
                <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fcd34d" stopOpacity="0" />
                  <stop offset="30%" stopColor="#fcd34d" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Pouring Stream */}
              <motion.line
                x1="100" y1="-200"
                x2="100" y2="380"
                stroke="url(#streamGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 600,
                  strokeDashoffset: streamOffset,
                  opacity: streamOpacity,
                  filter: "blur(1px)"
                }}
              />

              {/* The Liquid Fill Layer (Masked to Bottle Shape) */}
              <g clipPath="url(#bottleMask)">
                {/* The actual liquid rectangle moving up */}
                <motion.rect
                  x="0"
                  width="200"
                  height="400"
                  fill="url(#oilGrad)"
                  style={{ y: liquidY }}
                />

                {/* Liquid Surface Highlight */}
                <motion.rect
                  x="0"
                  width="200"
                  height="6"
                  fill="#fde68a"
                  style={{ y: liquidY }}
                  filter="blur(2px)"
                />

                {/* Inner Glass Shadow / Rim Light */}
                <path d="M 50 160 L 50 380" stroke="rgba(255,255,255,0.4)" strokeWidth="6" filter="blur(3px)" opacity="0.6" fill="none" />
                <path d="M 150 160 L 150 380" stroke="rgba(0,0,0,0.4)" strokeWidth="8" filter="blur(4px)" opacity="0.5" fill="none" />
              </g>

              {/* Premium Glass Bottle Outline */}
              {/* Outer thick glass glow */}
              <path
                d="M 85 40 L 115 40 L 115 80 C 115 110, 150 120, 150 160 L 150 380 C 150 395, 140 400, 100 400 C 60 400, 50 395, 50 380 L 50 160 C 50 120, 85 110, 85 80 Z"
                stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" filter="blur(4px)"
              />
              {/* Crisp inner glass outline */}
              <path
                d="M 85 40 L 115 40 L 115 80 C 115 110, 150 120, 150 160 L 150 380 C 150 395, 140 400, 100 400 C 60 400, 50 395, 50 380 L 50 160 C 50 120, 85 110, 85 80 Z"
                stroke="rgba(255,255,255,0.5)" strokeWidth="3" fill="none"
              />
              {/* Glass base thickness */}
              <path d="M 55 385 Q 100 395 145 385" stroke="rgba(255,255,255,0.6)" strokeWidth="4" fill="none" filter="blur(1px)" />

              {/* Animated Cap Group */}
              <motion.g style={{ y: capY, opacity: capOpacity }}>
                <rect x="75" y="15" width="50" height="25" fill="#1e293b" rx="2" />
                <rect x="75" y="36" width="50" height="4" fill="#f59e0b" />
                {/* Cap highlight */}
                <rect x="80" y="15" width="5" height="25" fill="rgba(255,255,255,0.2)" />
              </motion.g>

            </svg>

            {/* Premium Label overlay (HTML for better text rendering) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity: labelOpacity, scale: labelScale }}
            >
              <div className="w-[60%] h-[25%] bg-[#0a0500]/95 backdrop-blur-xl border border-mustard-500/40 rounded-xl flex flex-col items-center justify-center shadow-2xl p-4 mt-20 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-mustard-600 via-amber-400 to-mustard-600" />
                <Droplets className="w-6 h-6 md:w-8 md:h-8 text-mustard-500 mb-2 drop-shadow-md" />
                <p className="text-[8px] md:text-[10px] font-black tracking-[0.3em] text-mustard-400 uppercase text-center mb-1">Premium</p>
                <p className="text-xs md:text-sm font-display font-bold text-white uppercase text-center leading-tight">Mustard<br />Oil</p>
              </div>
            </motion.div>

          </motion.div>

          {/* Final Right Text */}
          <motion.div
            className="absolute inset-x-6 bottom-20 md:bottom-auto md:relative flex-1 text-center md:text-right z-30"
            style={{ opacity: finalTitleOpacity, y: finalTitleY }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white mb-6 drop-shadow-2xl">
              Purity Sealed.
            </h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto md:mx-0 md:ml-auto text-sm md:text-lg font-light leading-relaxed">
              Meticulously cold-pressed and bottled at the source to preserve natural pungency, essential nutrients, and authentic flavor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end">
              <a href="#products" className="px-8 py-4 bg-gradient-to-r from-mustard-500 to-amber-600 hover:from-mustard-400 hover:to-amber-500 text-slate-900 font-bold rounded-full transition-all shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)] interactive hover:scale-105">
                Shop Our Collection
              </a>
            </div>
          </motion.div>

        </div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 pointer-events-none"
        >
          <span className="text-[10px] text-mustard-400 uppercase tracking-[0.4em] font-bold">Scroll Down</span>
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="p-3 rounded-full border border-mustard-500/30 bg-black/50 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <ChevronDown className="w-5 h-5 text-mustard-400" />
          </motion.div>
        </motion.div>

        {/* Blending Gradient at Bottom */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#231710] to-transparent z-40 pointer-events-none" />

      </div>
    </section>
  );
};

export default Hero;
