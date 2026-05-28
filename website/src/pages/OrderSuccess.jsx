import { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { CheckCircle, Truck, Package, ArrowLeft } from 'lucide-react';

const OrderSuccess = () => {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear cart upon hitting success page once on mount
  useEffect(() => {
    clearCart();
  }, []);

  // Read order ID from checkout state or default
  const orderId = location.state?.orderId || `ORD-KCT-${Math.floor(Math.random() * 90000) + 10000}`;

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-500"
        >
          <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4"
        >
          Order <span className="text-gradient">Placed Successfully!</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-slate-600 dark:text-slate-300 mb-10"
        >
          Thank you for choosing KC Traders. Your premium mustard oil is being packed with care.
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-8 mb-10 shadow-sm max-w-md mx-auto relative overflow-hidden"
        >
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Package className="w-32 h-32" />
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Order Tracking ID</p>
              <p className="text-xl font-bold text-slate-900 dark:text-mustard-400">{orderId}</p>
            </div>
            
            <div className="h-px w-full bg-slate-100 dark:bg-white/10" />
            
            <div className="text-left flex items-start gap-4">
              <div className="p-3 bg-mustard-50 dark:bg-mustard-900/20 rounded-xl">
                 <Truck className="w-6 h-6 text-mustard-600 dark:text-mustard-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Estimated Delivery</p>
                <p className="font-semibold text-slate-900 dark:text-white">3 - 5 Business Days</p>
                <p className="text-xs text-slate-500 mt-1">You will receive an SMS on dispatch.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl interactive text-center"
          >
            <Package className="w-5 h-5" /> View Your Orders
          </Link>
          <Link 
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white font-bold rounded-xl transition-all shadow-md interactive text-center"
          >
            <ArrowLeft className="w-5 h-5" /> Continue Shopping
          </Link>
        </motion.div>

        <p className="mt-12 text-xs text-slate-400 max-w-sm mx-auto">
          Notice: This checkout and success loop is a mock demonstration built directly into the KC Traders frontend.
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;
