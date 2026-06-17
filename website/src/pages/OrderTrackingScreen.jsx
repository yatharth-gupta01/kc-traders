import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Clock, MapPin, Phone, MessageSquare, ShieldCheck, ChevronLeft } from 'lucide-react';

const OrderTrackingScreen = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || 'ORD-SIMULATED-99';

  const steps = [
    { title: 'Order Placed', time: '05:10 PM', desc: 'Secure payment captured by Razorpay', completed: true },
    { title: 'Accepted by Factory', time: '05:15 PM', desc: 'Stock reserved & packed at Jarar Hub', completed: true },
    { title: 'Out for Delivery', time: '05:22 PM', desc: 'Assigned to Ram Singh (Agra node)', completed: true, active: true },
    { title: 'Delivered', time: 'Estimate: 05:40 PM', desc: 'Secure verification receipt generated', completed: false }
  ];

  return (
    <div className="min-h-screen pt-24 pb-28 bg-[#f8f9fa] dark:bg-[#0c0806] text-slate-900 dark:text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-black/20 border-b border-slate-100 dark:border-white/5 flex items-center gap-4 relative z-10 backdrop-blur-xl">
        <Link to="/dashboard" className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 active:scale-95 text-slate-600 dark:text-slate-400">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-display font-black text-slate-900 dark:text-white">Track Order</h1>
          <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">{orderId}</p>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-xl mx-auto w-full space-y-6">
        {/* Mock Map / Visualizer */}
        <div className="h-64 rounded-[2rem] bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 overflow-hidden relative shadow-inner">
          {/* Mock Map Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          {/* Mock Factory Node & Customer Pins */}
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white border-2 border-mustard-500 flex items-center justify-center shadow-lg"><MapPin className="w-4 h-4 text-mustard-500 fill-current" /></div>
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Jarar Factory</span>
          </div>

          <div className="absolute right-1/4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-mustard-500 border-2 border-slate-900 dark:border-white flex items-center justify-center shadow-lg"><MapPin className="w-4 h-4 text-slate-900 fill-current" /></div>
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Your Aisle</span>
          </div>

          {/* Delivery Van/Dot animation */}
          <motion.div 
            animate={{ x: ['120%', '240%', '120%'] }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute left-1/4 top-1/2 -translate-y-1/2 mt-[-16px] w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white border-2 border-white shadow-xl z-20"
          >
            🚚
          </motion.div>

          {/* Connective line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="#eab308" strokeWidth="3" strokeDasharray="6 4" className="animate-pulse-soft" />
          </svg>

          {/* Floating Time indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full border border-white/10 shadow-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-mustard-500" /> Arriving in 18 Mins
          </div>
        </div>

        {/* Timeline Tracking cards */}
        <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 pb-2 border-b border-slate-100 dark:border-white/5">Delivery Milestone</h2>
          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-white/5 space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative pb-1">
                {/* Node circle */}
                <div className={`absolute -left-[31px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                  step.active ? 'bg-mustard-500 border-slate-900 dark:border-white scale-110 shadow-lg' :
                  step.completed ? 'bg-green-500 border-white dark:border-[#120d0a]' : 'bg-slate-200 dark:bg-white/10 border-white dark:border-[#120d0a]'
                }`}>
                  {step.completed && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className={`text-sm font-black leading-tight uppercase ${step.active ? 'text-mustard-600 dark:text-mustard-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Delivery Executive card */}
        <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-mustard-500/10 flex items-center justify-center font-black text-mustard-600 dark:text-mustard-400 text-lg shadow-inner">
              RS
            </div>
            <div>
              <p className="text-xs font-black uppercase text-slate-900 dark:text-white">Ram Singh</p>
              <p className="text-[10px] text-slate-400 font-medium">Your Delivery Executive • Agra Node</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="tel:+91999999999" className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-mustard-500 active:scale-95 transition-all">
              <Phone className="w-4 h-4" />
            </a>
            <button className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-mustard-500 active:scale-95 transition-all">
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Crytographic Sign Seal */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> GPS Verification Active. Real-time factory dispatch monitoring.
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingScreen;
