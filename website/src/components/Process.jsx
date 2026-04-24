import { motion } from 'framer-motion';

const Process = () => {
  const steps = [
    {
      num: "01",
      title: "Finest Seed Selection",
      desc: "We source only the best quality, hand-picked mustard seeds directly from the local farmers of Uttar Pradesh.",
    },
    {
      num: "02",
      title: "Cleaning & Drying",
      desc: "Seeds undergo a rigorous multi-stage cleaning process to remove impurities, dust, and moisture.",
    },
    {
      num: "03",
      title: "Traditional Crushing",
      desc: "Using the traditional 'Kacchi Ghani' wooden press method at low temperatures to retain nutrients and flavor.",
    },
    {
      num: "04",
      title: "Filtration & Purity",
      desc: "The extracted oil is naturally filtered multiple times without the use of any chemicals or solvents.",
    },
    {
      num: "05",
      title: "Hygienic Packaging",
      desc: "Finally, the pure oil is packed in tamper-proof, food-grade automated packaging to ensure freshness.",
    }
  ];

  return (
    <section id="process" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Abstract Background pattern */}
      <div className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: "radial-gradient(#eab308 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />
      
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            The <span className="text-mustard-400">Journey</span> Form Seed To Drop
          </h2>
          <p className="text-lg text-slate-400">
            Witness our meticulous manufacturing process that guarantees the uncompromised purity and heritage in every bottle.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Connecting Line */}
          <div className="absolute top-0 bottom-0 left-8 md:left-1/2 w-1 bg-slate-800 -translate-x-1/2 hidden sm:block" />

          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex flex-col sm:flex-row items-start sm:items-center mb-16 last:mb-0 ${isEven ? 'sm:justify-end' : 'sm:justify-start'}`}
              >
                {/* Center Node */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-900 border-4 border-mustard-500 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(234,179,8,0.3)] hidden sm:flex">
                  <span className="text-sm font-bold text-mustard-400">{step.num}</span>
                </div>

                {/* Content Card */}
                <div className={`w-full sm:w-5/12 pl-20 sm:pl-0 ${isEven ? 'sm:text-right sm:pr-12' : 'sm:text-left sm:pl-12'}`}>
                  <div className="glass-card bg-white/5 border-white/10 p-6 sm:p-8 rounded-2xl hover:bg-white/10 transition-colors">
                    <span className="text-mustard-500 text-xl font-display font-bold mb-2 block sm:hidden">{step.num}.</span>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Process;
