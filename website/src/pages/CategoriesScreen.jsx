import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Check, Plus, Minus, Search, Sparkles } from 'lucide-react';
import { productsData } from '../data/products';
import { API_URL } from '../config/api';

const CategoriesScreen = () => {
  const { cartItems, addToCart } = useCart();
  const { user } = useAuth();
  const isShopkeeper = user?.role === 'shopkeeper';

  const [activeCategory, setActiveCategory] = useState('Kacchi Ghani');
  const [stockList, setStockList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'Kacchi Ghani', name: 'Kacchi Ghani', desc: 'Cold Pressed Purity' },
    { id: 'Premium Filtered', name: 'Filtered Oil', desc: 'Double Filtered Light' },
    { id: 'Yellow Mustard', name: 'Yellow Mustard', desc: 'Mild & Aromatic' },
    { id: 'Combos & Gift Packs', name: 'Combos & Offers', desc: 'Value Savers' }
  ];

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(`${API_URL}/stock`);
        if (res.ok) {
          const data = await res.json();
          setStockList(data);
        }
      } catch (e) {
        console.error("Failed to fetch stock for categories", e);
      }
    };
    fetchStock();
  }, []);

  // Filter products by selected category
  const filteredProducts = productsData.filter(product => {
    const nameLower = product.name.toLowerCase();
    
    // Category Matching
    let categoryMatches = false;
    if (activeCategory === 'Kacchi Ghani') {
      categoryMatches = nameLower.includes('kacchi') || product.id === 'kcm-01' || product.id === 'kcm-03';
    } else if (activeCategory === 'Premium Filtered') {
      categoryMatches = nameLower.includes('filtered') || product.id === 'kcm-02' || product.id === 'kcm-04';
    } else if (activeCategory === 'Yellow Mustard') {
      categoryMatches = nameLower.includes('yellow') || product.id === 'kcm-05' || product.id === 'kcm-06';
    } else if (activeCategory === 'Combos & Gift Packs') {
      categoryMatches = nameLower.includes('combo') || nameLower.includes('pack') || nameLower.includes('set');
    }

    if (!categoryMatches) return false;

    // Search Query Matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return product.name.toLowerCase().includes(q) || product.subtitle.toLowerCase().includes(q);
    }

    return true;
  });

  const getProductCartQty = (variantId) => {
    const item = cartItems.find(i => i.id === variantId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen pt-24 pb-28 bg-[#f8f9fa] dark:bg-[#0c0806] text-slate-900 dark:text-white flex flex-col">
      {/* Header Search Bar Area */}
      <div className="px-6 py-4 bg-white dark:bg-black/20 border-b border-slate-100 dark:border-white/5 flex flex-col gap-3 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-black text-slate-900 dark:text-white">
            Product <span className="text-mustard-500">Aisle</span>
          </h1>
          <div className="flex items-center gap-1 bg-mustard-500/10 text-mustard-600 dark:text-mustard-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3 fill-current" /> Live Stocks
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search within categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-mustard-500 transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Main Categories Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left category rail */}
        <div className="w-24 md:w-32 bg-white dark:bg-[#120d0a] border-r border-slate-100 dark:border-white/5 flex flex-col overflow-y-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`py-6 px-2 flex flex-col items-center justify-center text-center relative transition-all duration-300 border-b border-slate-50 dark:border-white/5 ${
                  isActive ? 'bg-[#f8f9fa] dark:bg-[#0c0806] text-mustard-500 font-bold' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="category-rail-indicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-mustard-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                )}
                <span className="text-xs font-black tracking-tight leading-tight uppercase">{cat.name}</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider hidden md:block">{cat.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Right product viewport */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-[#0c0806]">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <ShoppingBag className="w-12 h-12 mb-2 opacity-20 text-mustard-500 animate-bounce" />
              <p className="text-sm font-semibold">No oils found in this aisle.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                // Default variant size
                const defaultVariant = product.variants.find(v => v.size === '1L') || product.variants[0];
                
                // Variant Price & stock logic
                const price = isShopkeeper ? defaultVariant.wholesalePrice : defaultVariant.retailPrice;
                
                const stockRow = stockList.find(s => s.product_name === activeCategory);
                const capacityLiters = parseFloat(defaultVariant.volume.replace(/[^\d.]/g, '')) / (defaultVariant.volume.includes('ml') ? 1000 : 1);
                const isInStock = stockRow ? stockRow.available_liters >= capacityLiters : true;
                
                const cartQty = getProductCartQty(defaultVariant.id);

                return (
                  <motion.div 
                    layout
                    key={product.id}
                    className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-4 shadow-sm flex flex-col justify-between relative"
                  >
                    {/* Add to Wishlist or Details click wrapper */}
                    <Link to={`/product/${product.id}`} className="flex gap-3 items-center mb-3">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center p-2 flex-shrink-0 relative">
                        <div className={`absolute inset-0 bg-gradient-to-tr ${product.color} opacity-10 rounded-2xl`} />
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain relative z-10" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight uppercase truncate">{product.name}</h3>
                        <p className="text-[9px] text-slate-500 mt-0.5 capitalize">{product.subtitle}</p>
                        <p className="text-[10px] font-black text-mustard-600 dark:text-mustard-400 mt-1">₹{price} <span className="text-[8px] font-medium text-slate-400">/ {defaultVariant.size}</span></p>
                      </div>
                    </Link>

                    {/* Stock Alert or Quantity controls */}
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        {!isInStock && (
                          <span className="text-[8px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Out of Stock</span>
                        )}
                      </div>
                      
                      {isInStock && (
                        <div>
                          {cartQty > 0 ? (
                            <div className="flex items-center border border-mustard-500 rounded-xl overflow-hidden bg-mustard-500/5 h-8">
                              <button 
                                onClick={() => addToCart(defaultVariant, -1)}
                                className="px-2 h-full flex items-center justify-center text-mustard-500 font-bold active:bg-mustard-500/20"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-xs font-black text-slate-900 dark:text-white">{cartQty}</span>
                              <button 
                                onClick={() => addToCart(defaultVariant, 1)}
                                className="px-2 h-full flex items-center justify-center text-mustard-500 font-bold active:bg-mustard-500/20"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart({
                                id: defaultVariant.id,
                                name: `${product.name} (${defaultVariant.size})`,
                                subtitle: product.subtitle,
                                image: product.image,
                                retailPrice: defaultVariant.retailPrice,
                                wholesalePrice: defaultVariant.wholesalePrice,
                                volume: defaultVariant.volume
                              })}
                              className="px-3 py-1.5 bg-slate-900 dark:bg-mustard-500 text-white dark:text-slate-900 text-xs font-black rounded-xl hover:bg-mustard-600 transition shadow-md flex items-center gap-1 active:scale-95"
                            >
                              <Plus className="w-3 h-3" /> ADD
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesScreen;
