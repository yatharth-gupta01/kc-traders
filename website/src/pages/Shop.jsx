import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

import { productsData } from '../data/products';

const Shop = () => {
  const { user } = useAuth();
  const { addToCart, getPriceForUser } = useCart();

  const isShopkeeper = user?.role === 'shopkeeper';

  const [volumeFilter, setVolumeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('none'); // 'low', 'high'
  const [stockList, setStockList] = useState([]);

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

  const filteredProducts = productsData
    .filter(p => volumeFilter === 'All' || p.volume === volumeFilter)
    .filter(p => {
      if (stockList.length === 0) return true; // While loading, show all
      
      let category = null;
      const nameLower = p.name.toLowerCase();
      if (nameLower.includes('kacchi ghani') || p.id === 'kcm-01' || p.id === 'kcm-03') {
        category = 'Kacchi Ghani';
      } else if (nameLower.includes('premium filtered') || p.id === 'kcm-02' || p.id === 'kcm-04') {
        category = 'Premium Filtered';
      } else if (nameLower.includes('yellow mustard') || p.id === 'kcm-05' || p.id === 'kcm-06') {
        category = 'Yellow Mustard';
      }

      if (!category) return true;
      const stockRow = stockList.find(s => s.product_name === category);
      if (!stockRow) return true;

      let capacityLiters = 1;
      if (p.volume) {
        const parsedVolume = parseFloat(p.volume.replace(/[^\d.]/g, ''));
        if (!isNaN(parsedVolume)) {
          capacityLiters = parsedVolume;
        }
      }

      return stockRow.available_liters >= capacityLiters;
    })
    .sort((a, b) => {
      if (sortOrder === 'low') return getPriceForUser(a) - getPriceForUser(b);
      if (sortOrder === 'high') return getPriceForUser(b) - getPriceForUser(a);
      return 0;
    });

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-200 dark:border-white/10 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4">
              Premium <span className="text-gradient">Catalog</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 max-w-xl">
              Select from our range of 100% pure authentic Agra mustard oils. 
            </p>
          </div>

          <div className="mt-6 md:mt-0 glass px-6 py-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-mustard-100 dark:bg-mustard-900/30 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-mustard-600 dark:text-mustard-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current Pricing Tier</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {isShopkeeper ? (
                  <span className="text-mustard-600 dark:text-mustard-400">Wholesale (B2B) Mode Active</span>
                ) : (
                  <span>Standard Retail</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
             <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Filter by Volume</h3>
                <div className="space-y-3">
                  {['All', '1L', '5L', '15L'].map(vol => (
                    <label key={vol} className="flex items-center gap-3 cursor-pointer group text-slate-700 dark:text-slate-300 hover:text-mustard-500">
                      <input 
                        type="radio" 
                        name="volume"
                        checked={volumeFilter === vol} 
                        onChange={() => setVolumeFilter(vol)} 
                        className="w-4 h-4 text-mustard-500 focus:ring-mustard-500 rounded-full bg-slate-100 dark:bg-earth-dark border-transparent"
                      />
                      <span className="font-medium text-sm">{vol} {vol !== 'All' ? 'Packs' : ''}</span>
                    </label>
                  ))}
                </div>
             </div>

             <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sort By Price</h3>
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-mustard-500"
                >
                  <option value="none">Recommended</option>
                  <option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option>
                </select>
             </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product, idx) => {
                const price = getPriceForUser(product);
                const originalPrice = product.retailPrice;

                return (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Image */}
                    <Link to={`/product/${product.id}`} className="block h-64 relative overflow-hidden bg-slate-100 dark:bg-black/40 p-6 flex justify-center">
                      <div className={`absolute inset-0 bg-gradient-to-t ${product.color} opacity-10 mix-blend-multiply z-10`} />
                      <img src={product.image} alt={product.name} className="h-full w-auto object-contain z-20 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg" />
                      <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] uppercase font-bold tracking-widest">{product.volume}</div>
                    </Link>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                         <p className="text-mustard-600 dark:text-mustard-400 font-bold text-[10px] uppercase tracking-widest leading-none mt-1">{product.subtitle}</p>
                         <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300">
                           ★ {product.rating}
                         </div>
                      </div>
                      <Link to={`/product/${product.id}`}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-mustard-500 transition-colors">{product.name}</h3>
                      </Link>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          {isShopkeeper && <p className="text-xs text-slate-400 line-through">₹{originalPrice}</p>}
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            ₹{price} <span className="text-xs font-normal text-slate-500">/{product.id.includes('15L') ? 'Tin' : 'Unit'}</span>
                          </p>
                        </div>
                        
                        {user && user.role !== 'admin' && (
                          <div className="flex gap-2">
                             <button 
                               onClick={(e) => {
                                 e.preventDefault(); 
                                 addToCart(product);
                               }}
                               className="w-12 h-12 bg-slate-900 hover:bg-mustard-500 dark:bg-mustard-500 dark:hover:bg-mustard-600 text-white dark:text-slate-900 rounded-xl flex items-center justify-center transition-colors interactive shadow-md"
                               title="Add to cart"
                             >
                               <ShoppingBag className="w-5 h-5" />
                             </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {filteredProducts.length === 0 && (
               <div className="w-full text-center py-20 text-slate-500 font-bold">
                 No products match your filters.
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
