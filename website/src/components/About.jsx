import { motion } from 'framer-motion';

const About = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-earth-dark">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-mustard-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col"
          >
            <div className="inline-block w-max px-3 py-1 bg-mustard-100 dark:bg-mustard-900/30 text-mustard-700 dark:text-mustard-400 rounded-full text-sm font-semibold tracking-wider mb-6">
              OUR HERITAGE
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Rooted in Tradition, <br/>
              <span className="text-gradient">Driven by Quality</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Located in the rustic landscapes of Jarar, Bah, Agra, K.C. Traders was born out of a profound passion for authentic Indian flavors. For decades, our family has been deeply connected with the local farmers and the golden fields of Uttar Pradesh.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              We blend generations-old extraction techniques with modern, state-of-the-art hygienic processing. This ensures that every drop of our mustard oil retains its pungent aroma, natural color, and complete nutritional profile.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col glass p-5 rounded-2xl border-l-4 border-l-mustard-500">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">100%</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Pure & Natural</span>
              </div>
              <div className="flex flex-col glass p-5 rounded-2xl border-l-4 border-l-mustard-500">
                <span className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">Jarar</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Bah, Agra Location</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-square">
              <img 
                src="/assets/mustard_seeds.png" 
                alt="Mustard fields and processing" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8">
                <div className="glass-card p-6 rounded-2xl backdrop-blur-xl bg-white/10">
                  <p className="text-white font-medium italic text-lg leading-snug">
                    "From our golden fields directly to your kitchen. Purity you can taste, quality you can trust."
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating abstract decorative element */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 w-32 h-32 bg-mustard-400 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] shadow-lg blur-[1px] opacity-70 dark:opacity-40 hidden md:block"
            />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};

export default About;
