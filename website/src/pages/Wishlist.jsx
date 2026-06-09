import { API_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingBag, X, AlertCircle, ArrowRight } from 'lucide-react';
import { productsData } from '../data/products';

const Wishlist = () => {
  const { user } = useAuth();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart, getPriceForUser } = useCart();
  const navigate = useNavigate();

  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const isShopkeeper = user?.role === 'shopkeeper';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchStock = async () => {
      try {
        const res = await fetch(`${API_URL}/stock`);
        if (res.ok) {
          const data = await res.json();
          setStockList(data);
        }
      } catch (e) {
        console.error("Failed to fetch stock", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, [user, navigate]);

  const handleMoveToCart = (item, product, variant, isInStock) => {
    if (!isInStock) return;
    
    addToCart({
      id: variant.id,
      name: `${product.name} (${variant.size})`,
      subtitle: product.subtitle,
      image: product.image,
      retailPrice: variant.retailPrice,
      wholesalePrice: variant.wholesalePrice,
      volume: variant.volume
    });
    
    // Remove from wishlist after moving to cart
    removeFromWishlist(variant.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#f8f9fa] dark:bg-[#120d0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-mustard-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#f8f9fa] dark:bg-[#120d0a] selection:bg-mustard-500/30">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-slate-200 dark:border-white/5 pb-8 relative">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white mb-4 flex items-center gap-4 tracking-tight">
              <Heart className="w-10 h-10 text-red-500 fill-red-500" />
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Wishlist</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl text-lg">
              Your curated collection of premium mustard oils. Save them here and move them to your cart when you're ready.
            </p>
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlistItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-red-300 dark:text-red-500/50" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your wishlist is empty</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
              Discover our range of cold-pressed mustard oils and click the heart icon to save your favorites.
            </p>
            <Link 
              to="/shop"
              className="px-8 py-3 bg-mustard-500 hover:bg-mustard-600 text-white font-bold rounded-full transition-colors flex items-center gap-2"
            >
              Browse Shop <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {wishlistItems.map((item, idx) => {
                const product = productsData.find(p => p.id === item.product_id);
                if (!product) return null;
                
                const variant = product.variants.find(v => v.id === item.variant_id);
                if (!variant) return null;

                const category = product.name.includes('Kacchi Ghani') ? 'Kacchi Ghani' 
                               : product.name.includes('Premium Filtered') ? 'Premium Filtered' 
                               : 'Yellow Mustard';
                const stockRow = stockList.find(s => s.product_name === category);
                const capacityLiters = parseFloat(variant.volume.replace(/[^\d.]/g, '')) / (variant.volume.includes('ml') ? 1000 : 1);
                const isInStock = stockRow ? stockRow.available_liters >= capacityLiters : true;
                
                const price = isShopkeeper ? variant.wholesalePrice : variant.retailPrice;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    transition={{ duration: 0.3 }}
                    key={variant.id}
                    className="glass-card bg-white dark:bg-black/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromWishlist(variant.id)}
                      className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md shadow-sm border border-slate-100 dark:border-white/10 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                      title="Remove from wishlist"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Stock Alert Badge */}
                    {!isInStock && (
                      <div className="absolute top-4 left-4 z-30 bg-red-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Out of Stock
                      </div>
                    )}

                    {/* Image */}
                    <div className="h-48 relative overflow-hidden bg-slate-50 dark:bg-white/5 p-6 flex justify-center items-center">
                      <div className={`absolute inset-0 bg-gradient-to-t ${product.color} opacity-5 dark:opacity-10 mix-blend-multiply z-10 transition-opacity`} />
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className={`h-full w-auto object-contain z-20 drop-shadow-lg transition-transform duration-500 group-hover:scale-110 ${!isInStock ? 'grayscale opacity-50' : ''}`} 
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-mustard-600 dark:text-mustard-400 font-bold text-[10px] uppercase tracking-widest mb-1">{variant.size} • {product.subtitle}</p>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                        {product.name}
                      </h3>

                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                          ₹{price}
                        </p>
                        
                        <button
                          onClick={() => handleMoveToCart(item, product, variant, isInStock)}
                          disabled={!isInStock}
                          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                            isInStock 
                              ? 'bg-slate-900 hover:bg-mustard-500 dark:bg-mustard-500 dark:hover:bg-mustard-400 text-white dark:text-slate-900 shadow-md hover:shadow-lg hover:-translate-y-0.5' 
                              : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" /> 
                          {isInStock ? 'Move to Cart' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
