import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, Trash2, ShieldCheck, Clock, Tag, HelpCircle } from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      title: 'Order Dispatched 🚚',
      desc: 'Your order ORD-48275 has left the Agra Jarar factory node. Track live delivery now.',
      time: '10 Mins Ago',
      unread: true,
      icon: <Clock className="w-5 h-5 text-mustard-500" />
    },
    {
      id: 2,
      type: 'promo',
      title: 'Value Voucher Active 🏷️',
      desc: 'Get 15% off on our premium Yellow Mustard Oil canisters. Use code YELLOW15.',
      time: '2 Hours Ago',
      unread: true,
      icon: <Tag className="w-5 h-5 text-amber-500" />
    },
    {
      id: 3,
      type: 'security',
      title: 'PostgreSQL Encryption Online 🔒',
      desc: 'All user login and credentials database tables successfully encrypted with bcrypt salting.',
      time: '1 Day Ago',
      unread: false,
      icon: <ShieldCheck className="w-5 h-5 text-green-500" />
    },
    {
      id: 4,
      type: 'support',
      title: 'FSSAI License Verified ✅',
      desc: 'KC Traders factory verification renewed successfully. Quality and purity certified.',
      time: '3 Days Ago',
      unread: false,
      icon: <HelpCircle className="w-5 h-5 text-blue-500" />
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen pt-24 pb-28 bg-[#f8f9fa] dark:bg-[#0c0806] text-slate-900 dark:text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-black/20 border-b border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 active:scale-95 text-slate-600 dark:text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-display font-black text-slate-900 dark:text-white flex items-center gap-2">
            Inbox <Bell className="w-5 h-5 text-mustard-500" />
          </h1>
        </div>
        
        {notifications.some(n => n.unread) && (
          <button 
            onClick={markAllRead}
            className="text-xs font-black text-mustard-600 dark:text-mustard-400 uppercase tracking-widest hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 p-6 max-w-xl mx-auto w-full">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Bell className="w-12 h-12 mb-2 opacity-10 text-mustard-500 animate-pulse" />
            <p className="text-sm font-semibold">Your inbox is completely clear.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <motion.div
                  layout
                  key={n.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 50 }}
                  className={`glass-card border rounded-3xl p-4 shadow-sm flex items-start gap-4 transition-colors ${
                    n.unread 
                      ? 'bg-white dark:bg-[#1a1412] border-mustard-500/20' 
                      : 'bg-white/60 dark:bg-[#120d0a]/60 border-slate-100 dark:border-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                    {n.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`text-xs font-black uppercase leading-tight ${n.unread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </h3>
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{n.desc}</p>
                    
                    {n.type === 'order' && (
                      <Link 
                        to="/order-tracking"
                        state={{ orderId: 'ORD-48275' }}
                        className="inline-flex items-center gap-1 mt-3 text-[10px] font-black text-mustard-600 dark:text-mustard-400 uppercase tracking-widest hover:underline"
                      >
                        Track Shipment &rarr;
                      </Link>
                    )}
                  </div>

                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors active:scale-95 flex-shrink-0 mt-0.5"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
