import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Search, Mic, QrCode, Bell, Plus, Minus, 
  Sparkles, Star, ChevronRight, ShoppingBag, Heart 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productsData } from '../data/products';
import { API_URL } from '../config/api';

// Desktop Components
import Hero from '../components/Hero';
import About from '../components/About';
import Products from '../components/Products';
import Storytelling from '../components/Storytelling';
import Quality from '../components/Quality';
import Gallery from '../components/Gallery';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';
import Process from '../components/Process';

const Home = () => {
  const { user } = useAuth();
  const { cartItems, addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [stockList, setStockList] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const promoBanners = [
    { title: 'Super Saver Weeks!', desc: 'Flat 15% off on Kacchi Ghani 15L Tins', code: 'SAVER15', color: 'from-[#f59e0b] to-[#d97706]' },
    { title: 'Free Agra Delivery', desc: 'No delivery fee on orders above ₹1500', code: 'AGRAFREE', color: 'from-[#3b82f6] to-[#2563eb]' },
    { title: 'Tradition in every drop', desc: 'Sourced from gold fields of Jarar, Agra', code: 'PUREDROP', color: 'from-[#10b981] to-[#059669]' }
  ];

  const quickCategories = [
    { name: 'Kacchi Ghani', icon: '🧪', category: 'Kacchi Ghani' },
    { name: 'Filtered Oil', icon: '🍯', category: 'Premium Filtered' },
    { name: 'Yellow Mustard', icon: '🌼', category: 'Yellow Mustard' },
    { name: 'Combos & Offers', icon: '🎁', category: 'Combos' }
  ];

  // Window Resize Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Stocks
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(`${API_URL}/stock`);
        if (res.ok) {
          const data = await res.json();
          setStockList(data);
        }
      } catch (e) {
        console.error("Failed to fetch stock for home", e);
      }
    };
    fetchStock();
  }, []);

  // Fetch Recent Orders (if logged in)
  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!user || !user.token) return;
      try {
        const res = await fetch(`${API_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecentOrders(data.slice(0, 3)); // show last 3 orders
        }
      } catch (e) {
        console.error("Failed to fetch recent orders", e);
      }
    };
    fetchRecentOrders();
  }, [user]);

  // Promo Banner Auto-Slide
  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setActivePromoIndex((prev) => (prev + 1) % promoBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isMobile]);

  const getProductCartQty = (variantId) => {
    const item = cartItems.find(i => i.id === variantId);
    return item ? item.quantity : 0;
  };

  // ----------------------------------------------------
  // MOBILE RENDER (premium Blinkit/Instamart dashboard)
  // ----------------------------------------------------
  const renderMobileDashboard = () => (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0c0806] text-slate-900 dark:text-white pb-28">
      {/* Sticky top location & quick action header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#0c0806]/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {/* Location details */}
          <div className="flex items-center gap-2 cursor-pointer active:opacity-75 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-mustard-500/10 flex items-center justify-center text-mustard-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Delivering to</p>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                Jarar, Bah, Agra <span className="text-xs text-mustard-500">&#9662;</span>
              </h2>
            </div>
          </div>

          {/* Quick Scanner, Voice Search & Alerts icons */}
          <div className="flex items-center gap-2">
            <Link to="/qr-scanner" className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl active:scale-95 transition-all text-slate-600 dark:text-slate-400" title="QR Scanner">
              <QrCode className="w-5 h-5" />
            </Link>
            <Link to="/notifications" className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl active:scale-95 transition-all text-slate-600 dark:text-slate-400 relative" title="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            </Link>
          </div>
        </div>

        {/* Global sticky Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search 'Kacchi Ghani', 'Filtered'..."
              onClick={() => navigate('/shop')}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-black/35 border border-slate-200 dark:border-white/10 text-sm focus:outline-none placeholder:text-slate-400 cursor-pointer"
              readOnly
            />
          </div>
          <Link to="/voice-search" className="p-3 bg-mustard-500 text-slate-950 rounded-2xl active:scale-95 transition-all shadow-md shadow-mustard-500/10">
            <Mic className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main scrolling elements */}
      <div className="p-6 space-y-6">
        
        {/* Animated Greeting & Info Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-black">
              Hello, <span className="text-mustard-500 capitalize">{user ? user.name.split(' ')[0] : 'Guest'}</span> 👋
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ready for pure authentic culinary magic?</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3 fill-current" /> Live Factory Node
          </div>
        </div>

        {/* Swipeable Offers Promotion Banner Slider */}
        <div className="relative overflow-hidden rounded-[2rem] h-36 bg-slate-900 shadow-xl border border-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePromoIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className={`absolute inset-0 bg-gradient-to-r ${promoBanners[activePromoIndex].color} p-6 flex flex-col justify-between`}
            >
              <div className="relative z-10">
                <span className="bg-white/20 text-white border border-white/30 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Factory Deal</span>
                <h3 className="text-lg font-black text-white mt-2 leading-tight uppercase">{promoBanners[activePromoIndex].title}</h3>
                <p className="text-xs text-white/80 mt-0.5 font-medium">{promoBanners[activePromoIndex].desc}</p>
              </div>
              <div className="flex justify-between items-center z-10">
                <span className="text-[10px] font-bold text-white font-mono">Code: {promoBanners[activePromoIndex].code}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-0.5">Claim Now <ChevronRight className="w-3.5 h-3.5"/></span>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-3 right-4 flex gap-1.5 z-20">
            {promoBanners.map((_, idx) => (
              <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${activePromoIndex === idx ? 'bg-white w-4' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>

        {/* Instamart-style quick categories bubble slider */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Shop Categories</p>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
            {quickCategories.map((cat, i) => (
              <Link 
                to="/categories" 
                key={i} 
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 flex items-center justify-center text-2xl shadow-sm interactive hover:border-mustard-500/50">
                  {cat.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Reorder Section */}
        {recentOrders.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center pl-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Again</p>
              <Link to="/dashboard" className="text-[9px] font-black text-mustard-500 uppercase tracking-wider flex items-center gap-0.5">View History <ChevronRight className="w-3 h-3"/></Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {recentOrders.map((ord) => {
                const items = JSON.parse(ord.items_data);
                const firstItem = items[0];
                if (!firstItem) return null;

                return (
                  <div 
                    key={ord.id}
                    className="w-44 flex-shrink-0 glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-3 shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex gap-2 items-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 p-1 flex-shrink-0 flex items-center justify-center">
                        <img src={firstItem.image} alt={firstItem.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase leading-tight">{firstItem.name}</h4>
                        <p className="text-[8px] text-slate-400 mt-0.5 font-medium truncate">{firstItem.volume || '1L Canister'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[10px] font-black text-mustard-600 dark:text-mustard-400">₹{(firstItem.wholesalePrice || firstItem.retailPrice)}</span>
                      <button
                        onClick={() => addToCart(firstItem)}
                        className="px-2.5 py-1 bg-slate-900 dark:bg-mustard-500 text-white dark:text-slate-900 text-[9px] font-black rounded-lg active:scale-95 transition-all shadow"
                      >
                        REORDER
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Trending / Best Sellers Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pl-1">
            <h3 className="text-base font-display font-black uppercase tracking-tight">Best Sellers</h3>
            <Link to="/shop" className="text-[10px] font-black text-mustard-500 uppercase tracking-widest flex items-center gap-0.5">View Catalog <ChevronRight className="w-3.5 h-3.5"/></Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productsData.slice(0, 3).map((product) => {
              const defaultVariant = product.variants.find(v => v.size === '1L') || product.variants[0];
              const price = user?.role === 'shopkeeper' ? defaultVariant.wholesalePrice : defaultVariant.retailPrice;
              
              // Wishlist check
              const isSaved = isInWishlist(defaultVariant.id);
              const cartQty = getProductCartQty(defaultVariant.id);

              // Category Check
              let category = product.name.includes('Kacchi') ? 'Kacchi Ghani' : product.name.includes('Filtered') ? 'Premium Filtered' : 'Yellow Mustard';
              const stockRow = stockList.find(s => s.product_name === category);
              const capacityLiters = parseFloat(defaultVariant.volume.replace(/[^\d.]/g, '')) / (defaultVariant.volume.includes('ml') ? 1000 : 1);
              const isInStock = stockRow ? stockRow.available_liters >= capacityLiters : true;

              return (
                <div 
                  key={product.id}
                  className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-[2rem] p-4 shadow-sm relative flex flex-col justify-between group"
                >
                  {/* Heart button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!user) { navigate('/login'); return; }
                      isSaved ? removeFromWishlist(defaultVariant.id) : addToWishlist(product.id, defaultVariant.id);
                    }}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-50 dark:bg-black/50 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-red-500 active:scale-95 transition-all"
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  <Link to={`/product/${product.id}`} className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-2xl p-2 relative flex-shrink-0 flex items-center justify-center">
                      <div className={`absolute inset-0 bg-gradient-to-tr ${product.color} opacity-10 rounded-2xl`} />
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8px] bg-mustard-500/10 text-mustard-600 dark:text-mustard-400 font-black px-2 py-0.5 rounded-sm uppercase tracking-wider leading-none">{product.subtitle}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight truncate">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Size: {defaultVariant.size} pack</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-mustard-500 text-slate-950 px-1.5 py-0.5 rounded-md font-black text-[10px] flex items-center gap-0.5 leading-none">
                          {product.rating} <Star className="w-3 h-3 fill-current" />
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">{product.reviews} reviews</span>
                      </div>
                    </div>
                  </Link>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-mustard-600 dark:text-mustard-400">₹{price.toLocaleString()}</p>
                    </div>

                    {!isInStock ? (
                      <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-xl uppercase tracking-wider">Out of Stock</span>
                    ) : (
                      <div>
                        {cartQty > 0 ? (
                          <div className="flex items-center border border-mustard-500 rounded-xl overflow-hidden bg-mustard-500/5 h-8">
                            <button 
                              onClick={() => addToCart(defaultVariant, -1)}
                              className="px-2.5 h-full flex items-center justify-center text-mustard-500 font-bold active:bg-mustard-500/20"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-black text-slate-900 dark:text-white">{cartQty}</span>
                            <button 
                              onClick={() => addToCart(defaultVariant, 1)}
                              className="px-2.5 h-full flex items-center justify-center text-mustard-500 font-bold active:bg-mustard-500/20"
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
                            className="px-4 py-1.5 bg-slate-900 dark:bg-mustard-500 text-white dark:text-slate-900 text-xs font-black rounded-xl hover:bg-mustard-600 transition shadow-md flex items-center gap-1 active:scale-95"
                          >
                            <Plus className="w-3 h-3" /> ADD
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );

  // ----------------------------------------------------
  // DESKTOP RENDER (standard gorgeous marketing page)
  // ----------------------------------------------------
  const renderDesktopLanding = () => (
    <div className="relative w-full overflow-x-clip">
      <Hero />
      <About />
      <Products />
      <Process />
      <Storytelling />
      <Quality />
      <Gallery />
      <Testimonials />
      <Contact />
    </div>
  );

  return isMobile ? renderMobileDashboard() : renderDesktopLanding();
};

export default Home;
