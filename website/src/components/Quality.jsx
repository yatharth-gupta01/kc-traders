import { motion } from 'framer-motion';
import { HeartPulse, Droplet, Activity, CheckCircle, ShieldCheck } from 'lucide-react';

const Quality = () => {
  const benefits = [
    { icon: <HeartPulse className="w-8 h-8"/>, title: "Heart Healthy", desc: "Rich in MUFA and PUFA, promoting cardiovascular health." },
    { icon: <ShieldCheck className="w-8 h-8"/>, title: "Immunity Booster", desc: "Anti-bacterial properties that strengthen your body's defense." },
    { icon: <Droplet className="w-8 h-8"/>, title: "Skin & Hair", desc: "Natural Vitamin E keeps skin glowing and nourishes hair." },
    { icon: <Activity className="w-8 h-8"/>, title: "Improves Circulation", desc: "Traditional massage oil known for stimulating blood flow." }
  ];

  return (
    <section id="quality" className="py-24 bg-mustard-50 dark:bg-earth-dark/40 relative">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Top Split Area */}
        <div className="flex flex-col lg:flex-row gap-16 mb-24">
          <div className="lg:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6"
            >
              Certified <span className="text-mustard-600 dark:text-mustard-400">Quality</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 dark:text-slate-300 mb-8"
            >
              At K.C. Traders, quality is not just a promise; it's a measurable standard. Our factory is equipped with an in-house laboratory where every batch undergoes rigorous chemical and physical testing to ensure it meets FSSAI and Agmark specifications.
            </motion.p>
            
            <motion.ul 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {['FSSAI Certified Production', 'Agmark Grade 1 Standards', 'NABL Accredited Lab Testing', 'Zero Argemone Oil Guarantee'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-800 dark:text-slate-200 font-medium">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mustard-100 dark:bg-mustard-900/50 flex items-center justify-center text-mustard-600 dark:text-mustard-400">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="lg:w-1/2 grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-white/5 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center interactive"
            >
              <div className="w-20 h-20 bg-mustard-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-mustard-600">100%</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">Purity</h4>
              <p className="text-sm text-slate-500">Unadulterated natural goodness.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-mustard-500 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center mt-8 interactive"
            >
              <ShieldCheck className="w-16 h-16 text-white mb-4" />
              <h4 className="font-bold text-white mb-2">Agmark</h4>
              <p className="text-sm text-white/80">Certified highest grade.</p>
            </motion.div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-20">
          <h3 className="text-3xl font-display font-bold text-center text-slate-900 dark:text-white mb-12">Benefits of Pure Mustard Oil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-6 glass rounded-2xl border-b-4 border-b-transparent hover:border-b-mustard-500 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-mustard-100 dark:bg-mustard-900/30 text-mustard-600 dark:text-mustard-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-mustard-500 group-hover:text-white transition-all">
                  {b.icon}
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{b.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Quality;
