import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { ArrowDown, Flame, ShieldCheck, Sprout, Award, ShoppingBag, Leaf } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Storytelling = () => {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const slides = [
    {
      num: "01",
      tagline: "Acres of Golden Heritage",
      title: "Vast Mustard Farms",
      desc: "Our journey begins in the fertile fields of Uttar Pradesh and Rajasthan. Here, our mustard crops bloom in high-contrast yellow splendor under the natural sun, nurtured by generational farming techniques.",
      img: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=1600&q=80",
      icon: <Sprout className="w-5 h-5 text-mustard-400" />
    },
    {
      num: "02",
      tagline: "Harvested with Devotion",
      title: "Traditional Harvesting",
      desc: "In the cool breeze of early dawn, local farmers carefully hand-harvest the mature mustard crop. Hand-cutting preserves the integrity of each plant and ensures only the finest mustard pods are chosen.",
      img: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1600&q=80",
      icon: <Leaf className="w-5 h-5 text-mustard-400" />
    },
    {
      num: "03",
      tagline: "The Golden Selection",
      title: "Handpicked Seed Sorting",
      desc: "Once dried, the mustard seeds are gently thrashed. We conduct manual sorting and cleaning, rejecting any undersized or imperfect seeds. Only the plumpest, oil-rich seeds qualify for crushing.",
      img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1600&q=80",
      icon: <Award className="w-5 h-5 text-mustard-400" />
    },
    {
      num: "04",
      tagline: "Preserving Nature's Gift",
      title: "Kacchi Ghani Pressing",
      desc: "The seeds are crushed at low temperatures in a traditional wooden mortar (Kacchi Ghani). This slow, heat-free pressing retains the oil's vital nutrients, natural aroma, and characteristic pungent kick.",
      img: "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&w=1600&q=80",
      icon: <Flame className="w-5 h-5 text-mustard-400" />
    },
    {
      num: "05",
      tagline: "Unrefined & Untouched",
      title: "Natural Filtration",
      desc: "No chemical refining, decolorizing, or artificial elements. The oil is allowed to settle naturally and filtered through organic cotton cloths, maintaining its brilliant golden clarity and pure essence.",
      img: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1600&q=80",
      icon: <ShieldCheck className="w-5 h-5 text-mustard-400" />
    },
    {
      num: "06",
      tagline: "Sealed for Absolute Freshness",
      title: "Meticulous Packaging",
      desc: "Our liquid gold is bottled in food-grade, light-blocking premium containers. Every bottle is vacuum-sealed to prevent oxidation, ensuring the direct-from-farm freshness and aroma reaches you intact.",
      img: "https://images.unsplash.com/photo-1602161972199-3f0099859f51?auto=format&fit=crop&w=1600&q=80",
      icon: <ShoppingBag className="w-5 h-5 text-mustard-400" />
    },
    {
      num: "07",
      tagline: "The Soul of Indian Cooking",
      title: "Your Culinary Sanctuary",
      desc: "Unleash the ultimate flavor in your kitchen. As our mustard oil hits the hot pan, it releases a rich, nutty, authentic fragrance, turning daily meals into absolute culinary masterpieces.",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80",
      icon: <Flame className="w-5 h-5 text-mustard-400" />
    }
  ];

  useGSAP(() => {
    // Select elements within the scoped containerRef
    const images = gsap.utils.toArray('.story-img-pane');
    const texts = gsap.utils.toArray('.story-text-pane');

    if (images.length === 0 || texts.length === 0) return;

    // Set initial states securely
    gsap.set(images.slice(1), { opacity: 0, scale: 1.05 });
    gsap.set(images[0], { opacity: 1, scale: 1.1 });
    gsap.set(texts.slice(1), { opacity: 0, y: 40, pointerEvents: 'none' });
    gsap.set(texts[0], { opacity: 1, y: 0, pointerEvents: 'auto' });

    // Master Timeline linked to scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerRef.current,
        start: "top top",
        end: "+=600%", // 600% scroll duration
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      }
    });

    // Create transitions between consecutive slides
    slides.forEach((_, index) => {
      if (index === slides.length - 1) return;

      const nextIndex = index + 1;
      const progressSegmentStart = index;

      // Animate Image crossfade and scale
      tl.to(images[index], {
        opacity: 0,
        scale: 1.15,
        duration: 1,
        ease: "power2.inOut"
      }, progressSegmentStart)
      .to(images[nextIndex], {
        opacity: 1,
        scale: 1.1,
        duration: 1,
        ease: "power2.inOut"
      }, progressSegmentStart)

      // Animate Text crossfade
      .to(texts[index], {
        opacity: 0,
        y: -40,
        pointerEvents: 'none',
        duration: 0.5,
        ease: "power2.in"
      }, progressSegmentStart)
      .to(texts[nextIndex], {
        opacity: 1,
        y: 0,
        pointerEvents: 'auto',
        duration: 0.5,
        delay: 0.2, // slight offset for entrance
        ease: "power2.out"
      }, progressSegmentStart);
      
      // Vertical Progress Dot indicator animation
      const progressDot = containerRef.current.querySelector('.story-progress-dot');
      if (progressDot) {
        tl.to(progressDot, {
          y: `${(nextIndex / (slides.length - 1)) * 100}%`,
          duration: 1,
          ease: "none"
        }, progressSegmentStart);
      }
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative bg-earth-dark text-white select-none">
      {/* Scroll Trigger Height Container */}
      <div ref={triggerRef} className="h-screen w-full relative overflow-hidden">
        
        {/* Cinematic Background Images */}
        <div className="absolute inset-0 w-full h-full z-0 bg-black">
          {slides.map((slide, index) => (
            <div
              key={`img-${slide.num}`}
              className="story-img-pane absolute inset-0 w-full h-full origin-center transition-all duration-300"
              style={{ willChange: "opacity, transform" }}
            >
              {/* Overlay for cinematic gradient dark aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-r from-earth-dark/95 via-earth-dark/70 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-earth-dark via-transparent to-earth-dark/50 z-10" />
              <img
                src={slide.img}
                alt={slide.title}
                className="w-full h-full object-cover object-center filter brightness-[0.75]"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Ambient floating golden particles to represent the golden oil essence */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-30 mix-blend-screen overflow-hidden">
          <div className="absolute w-[30vw] h-[30vw] rounded-full bg-mustard-500/10 blur-[120px] top-[10%] left-[5%] animate-blob" />
          <div className="absolute w-[25vw] h-[25vw] rounded-full bg-mustard-400/10 blur-[100px] bottom-[15%] right-[10%] animate-blob [animation-delay:4s]" />
        </div>

        {/* Storytelling Content Layout */}
        <div className="container mx-auto h-full px-6 lg:px-16 flex items-center relative z-20">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
            
            {/* Left side: Vertical sleek Progress indicator (hidden on mobile) */}
            <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-between h-[60vh] relative py-4">
              <div className="text-sm font-semibold tracking-widest text-white/40">01</div>
              
              {/* Progress Line */}
              <div className="w-[2px] h-[75%] bg-white/10 rounded-full relative overflow-visible">
                {/* Glowing moving dot */}
                <div 
                  className="story-progress-dot absolute top-0 -left-[5px] w-3 h-3 rounded-full bg-mustard-400 shadow-[0_0_12px_#eab308] transition-transform duration-100"
                  style={{ transform: "translateY(0%)" }}
                />
              </div>
              
              <div className="text-sm font-semibold tracking-widest text-white/40">07</div>
            </div>

            {/* Middle/Right: Pinned Story Cards */}
            <div className="col-span-1 lg:col-span-8 relative h-[50vh] md:h-[45vh] lg:h-[55vh] flex items-center">
              
              {slides.map((slide, index) => (
                <div
                  key={`text-${slide.num}`}
                  className="story-text-pane absolute w-full max-w-2xl text-left flex flex-col items-start pr-4 md:pr-12"
                >
                  {/* Category Tagline with subtle glow */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner flex items-center justify-center">
                      {slide.icon}
                    </span>
                    <span className="text-xs md:text-sm font-semibold tracking-[0.25em] text-mustard-400 uppercase drop-shadow-md">
                      {slide.tagline}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight mb-6 leading-tight">
                    <span className="text-white/40 block text-2xl font-sans font-medium mb-1 tracking-wide">
                      Step {slide.num}
                    </span>
                    {slide.title}
                  </h2>

                  {/* Glassmorphic Description Card */}
                  <div className="glass-card bg-earth-dark/45 border-white/10 backdrop-blur-xl p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                    <p className="text-base md:text-lg text-slate-200 leading-relaxed font-sans font-light">
                      {slide.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: Scroll Call To Action */}
            <div className="hidden lg:flex lg:col-span-3 flex-col items-end justify-center text-right">
              <div className="flex flex-col items-center gap-2 group cursor-default">
                <span className="text-xs uppercase tracking-[0.3em] text-white/30 group-hover:text-mustard-400 transition-colors">
                  Scroll to progress
                </span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="p-3 rounded-full bg-white/5 border border-white/10 text-mustard-400 backdrop-blur-sm"
                >
                  <ArrowDown className="w-5 h-5" />
                </motion.div>
              </div>
            </div>

          </div>

        </div>

        {/* Ambient bottom border transition to blend back into earth-dark sections */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-earth-dark to-transparent z-20 pointer-events-none" />
      </div>
    </div>
  );
};

export default Storytelling;
