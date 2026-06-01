import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingCart, ArrowRight, Trash2, Tag, Info } from 'lucide-react';

const CartSidebar = () => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, getCartTotal, getPriceForUser } = useCart();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  
  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const subtotal = getCartTotal();
  // Example calculation: Free delivery over ₹5000, else ₹150 flat rate.
  const deliveryFee = subtotal > 0 ? (subtotal > 5000 ? 0 : 150) : 0;
  const total = subtotal + deliveryFee;

  // Variants for animations
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants = {
    hidden: { x: '100%', opacity: 0.5 },
    visible: { 
      x: 0, 
      opacity: 1, 
      transition: { type: 'spring', damping: 25, stiffness: 200 } 
    },
    exit: { 
      x: '100%', 
      opacity: 0,
      transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
    exit: { opacity: 0, x: -50, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop with strong blur */}
          <motion.div 
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Container */}
          <motion.div 
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white/90 dark:bg-[#1a120c]/90 backdrop-blur-2xl shadow-[-20px_0_40px_rgba(0,0,0,0.15)] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.6)] z-[101] flex flex-col border-l border-white/20 dark:border-white/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-black/20">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                <div className="p-2 bg-mustard-100 dark:bg-mustard-900/30 rounded-xl text-mustard-600 dark:text-mustard-400">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                My Cart
                {cartItems.length > 0 && (
                  <span className="text-sm font-semibold bg-mustard-500 text-white px-2.5 py-0.5 rounded-full ml-1">
                    {cartItems.length}
                  </span>
                )}
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
              {cartItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-mustard-400 blur-3xl opacity-20 rounded-full"></div>
                    <div className="w-40 h-40 bg-slate-50 dark:bg-earth-dark/50 rounded-full flex items-center justify-center relative border border-slate-100 dark:border-white/5 shadow-inner">
                      <ShoppingCart className="w-20 h-20 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">Looks like you haven't added anything to your cart yet.</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/shop');
                    }}
                    className="px-8 py-3 bg-mustard-500 hover:bg-mustard-600 text-slate-900 rounded-xl font-bold transition-colors shadow-lg shadow-mustard-500/30"
                  >
                    Start Shopping
                  </motion.button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {cartItems.map((item) => (
                      <motion.div 
                        key={item.id}
                        layout
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex gap-4 p-4 bg-white dark:bg-[#251b12] rounded-2xl border border-slate-100 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-md transition-shadow group relative overflow-hidden"
                      >
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-slate-50 dark:bg-black/40 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                          <img src={item.image} alt={item.name} className="h-20 w-20 object-contain group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight pr-4">{item.name}</h4>
                              <p className="text-mustard-600 dark:text-mustard-400 font-bold mt-1">₹{getPriceForUser(item).toLocaleString()}</p>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors p-1.5 rounded-lg absolute top-3 right-3"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-1 py-1 w-fit mt-3">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </motion.button>
                            <span className="text-sm font-bold w-6 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer / Summary */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-200/50 dark:border-white/10 bg-white/95 dark:bg-[#1a120c]/95 backdrop-blur-xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] z-10">
                
                {/* Coupon Code */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="relative flex-1 group">
                    <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mustard-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Coupon Code" 
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mustard-500 dark:text-white transition-all"
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                  >
                    Apply
                  </motion.button>
                </div>

                {/* Summary Lines */}
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      Delivery Charge 
                      <span className="group relative cursor-pointer flex items-center justify-center">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Free delivery over ₹5000</span>
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {deliveryFee === 0 ? <span className="text-emerald-500 font-bold">Free</span> : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-white/10 w-full my-3"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-slate-900 dark:text-white font-medium">Total</span>
                    <span className="text-2xl font-black text-mustard-600 dark:text-mustard-400">₹{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full py-4 bg-mustard-500 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-mustard-500/25 flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Checkout Securely <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out z-0"></div>
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
