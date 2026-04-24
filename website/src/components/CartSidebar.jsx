import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react';

const CartSidebar = () => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, getCartTotal, getPriceForUser } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-[#1a120c] shadow-2xl z-[101] flex flex-col border-l border-slate-100 dark:border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                <ShoppingCart className="w-5 h-5" /> Your Cart
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors interactive"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                  <ShoppingCart className="w-16 h-16 opacity-20" />
                  <p>Your cart is empty.</p>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/shop');
                    }}
                    className="px-6 py-2 mt-4 bg-mustard-50 dark:bg-mustard-900/20 text-mustard-600 dark:text-mustard-400 rounded-full font-semibold hover:bg-mustard-100 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-100 dark:border-white/5">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-earth-dark rounded-xl flex items-center justify-center flex-shrink-0">
                      <img src={item.image} alt={item.name} className="h-16 w-16 object-contain" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-1">{item.name}</h4>
                        <p className="text-mustard-600 dark:text-mustard-400 font-bold">₹{getPriceForUser(item)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-white dark:bg-earth-dark border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-red-500 hover:text-red-600 font-semibold underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-earth-dark">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">₹{getCartTotal()}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full py-4 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 interactive"
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
