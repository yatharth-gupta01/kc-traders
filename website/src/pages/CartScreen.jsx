import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Truck, ShieldCheck, Ticket, Plus, Minus } from 'lucide-react';

const CartScreen = () => {
  const { cartItems, addToCart, removeFromCart, getCartSubtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const cartSubtotal = getCartSubtotal();
  const deliveryFee = cartSubtotal > 1500 || cartSubtotal === 0 ? 0 : 50;
  const gstRate = 0.05; // 5% GST inclusive for mustard oil
  const gstAmount = cartSubtotal * gstRate;
  const grandTotal = cartSubtotal + deliveryFee;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-28 bg-[#f8f9fa] dark:bg-[#0c0806] text-slate-900 dark:text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-black/20 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
        <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white">
          Basket <span className="text-mustard-500">Summary</span>
        </h1>
        <span className="text-xs bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full font-black text-slate-600 dark:text-slate-400">
          {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items
        </span>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-2xl mx-auto w-full">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-20 text-mustard-500 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">Your basket is empty</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              Explore our premium mustard oil catalog to experience the richness of authentic Agra flavor.
            </p>
            <Link 
              to="/shop"
              className="mt-6 px-6 py-3 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-xl transition shadow-lg active:scale-95 text-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Delivery estimate banner */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-4 text-green-700 dark:text-green-400"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Fast Delivery Node</p>
                <p className="text-xs mt-0.5 opacity-90">Delivering in **15-20 mins** from Agra Factory Dispatch.</p>
              </div>
            </motion.div>

            {/* Cart Items List */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Basket Items</p>
              <AnimatePresence initial={false}>
                {cartItems.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -100 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center p-1 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white truncate uppercase leading-tight">{item.name}</h3>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-none">₹{(item.wholesalePrice || item.retailPrice)} / Unit</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden h-8 bg-slate-50 dark:bg-white/5">
                        <button 
                          onClick={() => addToCart(item, -1)}
                          className="px-2 h-full flex items-center justify-center text-slate-500 hover:text-mustard-500 font-bold active:bg-slate-200 dark:active:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item, 1)}
                          className="px-2 h-full flex items-center justify-center text-slate-500 hover:text-mustard-500 font-bold active:bg-slate-200 dark:active:bg-white/10"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl active:scale-95 transition-all"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Coupons Card */}
            <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-4 shadow-sm flex items-center justify-between text-sm cursor-pointer hover:border-mustard-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-mustard-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Apply Coupon Codes</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Price breakdown card */}
            <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 dark:border-white/5">Bill Synopsis</h3>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Subtotal Items</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹{cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>GST Tax Breakdown (5% Incl.)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Agra Hub Shipping Fee</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {deliveryFee === 0 ? <span className="text-green-600 dark:text-green-400 font-bold uppercase text-[10px]">Free Delivery</span> : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="border-t border-slate-100 dark:border-white/5 pt-3 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                <span>Total Amount Due</span>
                <span className="text-lg font-black text-mustard-500">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Cryptographic Sign Seal */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure checkout verified by Razorpay node.
            </div>

            {/* Sticky checkout button */}
            <div className="pt-4">
              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-mustard-500 dark:hover:bg-mustard-600 text-white dark:text-slate-900 font-black rounded-2xl transition shadow-xl flex items-center justify-center gap-2 text-base active:scale-[0.98] interactive shadow-mustard-500/10"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartScreen;
