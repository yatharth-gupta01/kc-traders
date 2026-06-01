import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Package, CheckCircle, XCircle, Info, Star, Heart } from 'lucide-react';
import { productsData } from '../data/products';

const ProductCard = ({ product, stockList, isShopkeeper, addToCart, getPriceForUser, idx }) => {
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  // Default to 1L variant if exists, else first variant
  const defaultVariant = product.variants.find(v => v.size === '1L') || product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);

  // Check if current variant is in stock based on liters
  const category = product.name.includes('Kacchi Ghani') ? 'Kacchi Ghani' 
                 : product.name.includes('Premium Filtered') ? 'Premium Filtered' 
                 : 'Yellow Mustard';
  
  const stockRow = stockList.find(s => s.product_name === category);
  
  const capacityLiters = parseFloat(selectedVariant.volume.replace(/[^\d.]/g, '')) / (selectedVariant.volume.includes('ml') ? 1000 : 1);
  const isInStock = stockRow ? stockRow.available_liters >= capacityLiters : true;

  const price = isShopkeeper ? selectedVariant.wholesalePrice : selectedVariant.retailPrice;
  const originalPrice = selectedVariant.retailPrice;

  const isSaved = isInWishlist(selectedVariant.id);

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (isSaved) {
      removeFromWishlist(selectedVariant.id);
    } else {
      addToWishlist(product.id, selectedVariant.id);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isInStock) return;
    
    addToCart({
      id: selectedVariant.id,
      name: `${product.name} (${selectedVariant.size})`,
      subtitle: product.subtitle,
      image: product.image,
      retailPrice: selectedVariant.retailPrice,
      wholesalePrice: selectedVariant.wholesalePrice,
      volume: selectedVariant.volume
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: idx * 0.05 }}
      className="glass-card bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2rem] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 flex flex-col group relative"
    >
      {/* Best Value Badge */}
      <AnimatePresence>
        {selectedVariant.isBestValue && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-4 left-4 z-30 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1"
          >
            <Star className="w-3 h-3 fill-white" /> Best Value
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wishlist Heart Button */}
      <button
        onClick={handleWishlistToggle}
        className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md shadow-lg border border-white/20 hover:scale-110 active:scale-95 transition-all"
        title="Add to Wishlist"
      >
        <motion.div
          animate={isSaved ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'}`} />
        </motion.div>
      </button>

      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="block h-64 relative overflow-hidden bg-slate-50/50 dark:bg-white/5 p-6 flex justify-center cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-t ${product.color} opacity-5 dark:opacity-10 mix-blend-multiply z-10 transition-opacity group-hover:opacity-10 dark:group-hover:opacity-20`} />
        
        <AnimatePresence mode="wait">
          <motion.img 
            key={selectedVariant.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            src={product.image} 
            alt={product.name} 
            className="h-full w-auto object-contain z-20 drop-shadow-2xl group-hover:scale-105 transition-transform duration-700" 
          />
        </AnimatePresence>
      </Link>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow relative z-20">
        <div className="flex justify-between items-start mb-2">
           <p className="text-mustard-600 dark:text-mustard-400 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">{product.subtitle}</p>
        </div>
        
        <Link to={`/product/${product.id}`}>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-mustard-600 dark:group-hover:text-mustard-400 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Variant Selector (Premium Pills) */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map(variant => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all overflow-hidden ${
                  selectedVariant.id === variant.id 
                    ? 'text-slate-900 dark:text-slate-900' 
                    : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {selectedVariant.id === variant.id && (
                  <motion.div
                    layoutId={`active-variant-${product.id}`}
                    className="absolute inset-0 bg-mustard-400"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{variant.size}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Price & Action Area */}
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/10">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={price}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {isShopkeeper && (
                  <p className="text-xs text-slate-400 line-through decoration-red-500/50 mb-0.5 font-medium">₹{originalPrice} Retail</p>
                )}
                <p className="text-3xl font-black text-slate-900 dark:text-white flex items-end gap-1">
                  ₹{price.toLocaleString()} 
                  <span className="text-xs font-bold text-slate-500 mb-1">/{selectedVariant.size}</span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              isInStock 
                ? 'bg-slate-900 hover:bg-mustard-500 dark:bg-mustard-500 dark:hover:bg-mustard-400 text-white dark:text-slate-900 shadow-slate-900/20 dark:shadow-mustard-500/20' 
                : 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed shadow-none'
            }`}
            title={isInStock ? "Add to cart" : "Out of stock"}
          >
            {isInStock ? <ShoppingBag className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </motion.button>
        </div>
        
        {!isInStock && (
           <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-right mt-2">Out of Stock</p>
        )}
      </div>
    </motion.div>
  );
};

const Shop = () => {
  const { user } = useAuth();
  const { addToCart, getPriceForUser } = useCart();
  const isShopkeeper = user?.role === 'shopkeeper';
  
  const [stockList, setStockList] = useState([]);
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stock');
        if (res.ok) {
          const data = await res.json();
          setStockList(data);
        }
      } catch (e) {
        console.error("Failed to fetch stock for shop", e);
      }
    };
    fetchStock();
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#f8f9fa] dark:bg-[#120d0a] selection:bg-mustard-500/30">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-slate-200 dark:border-white/5 pb-8 relative">
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-mustard-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-display font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-mustard-600 to-amber-500">Catalog</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl text-lg">
              Experience the richness of 100% pure authentic Agra mustard oils. Cold-pressed to perfection.
            </p>
          </div>

          <div className="mt-8 md:mt-0 glass px-6 py-4 rounded-2xl flex items-center gap-4 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/20 dark:shadow-none relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-mustard-400 to-mustard-600 rounded-full flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Account Status</p>
              <p className="font-bold text-slate-900 dark:text-white text-lg">
                {isShopkeeper ? (
                  <span className="text-mustard-600 dark:text-mustard-400">Wholesale Partner</span>
                ) : (
                  <span>Standard Retail</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productsData.map((product, idx) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              stockList={stockList}
              isShopkeeper={isShopkeeper}
              addToCart={addToCart}
              getPriceForUser={getPriceForUser}
              idx={idx}
            />
          ))}
        </div>
      </div>

      {/* Global Animated Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-10 right-10 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
              toast.type === 'error' 
                ? 'bg-red-500/90 text-white border-red-400 shadow-red-500/30' 
                : 'bg-slate-900/95 dark:bg-mustard-500/90 text-white dark:text-slate-900 border-slate-800 dark:border-mustard-400 shadow-slate-900/30'
            }`}
          >
            {toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span className="font-bold block drop-shadow-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
