import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, ShieldCheck, ChevronRight, Droplet, CheckCircle, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productsData } from '../data/products';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart, getPriceForUser } = useCart();
  const { user } = useAuth();
  const isShopkeeper = user?.role === 'shopkeeper';

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [stockList, setStockList] = useState([]);

  useEffect(() => {
    // Find the product by ID
    const found = productsData.find(p => p.id === id);
    setProduct(found);
    window.scrollTo(0, 0);

    const fetchStock = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stock');
        if (res.ok) {
          const data = await res.json();
          setStockList(data);
        }
      } catch (e) {
        console.error("Failed to fetch stock for details", e);
      }
    };
    fetchStock();
  }, [id]);

  const isOutOfStock = (() => {
    if (!product || stockList.length === 0) return false;

    let category = null;
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes('kacchi ghani') || product.id === 'kcm-01' || product.id === 'kcm-03') {
      category = 'Kacchi Ghani';
    } else if (nameLower.includes('premium filtered') || product.id === 'kcm-02' || product.id === 'kcm-04') {
      category = 'Premium Filtered';
    } else if (nameLower.includes('yellow mustard') || product.id === 'kcm-05' || product.id === 'kcm-06') {
      category = 'Yellow Mustard';
    }

    if (!category) return false;
    const stockRow = stockList.find(s => s.product_name === category);
    if (!stockRow) return false;

    let capacityLiters = 1;
    if (product.volume) {
      const parsedVolume = parseFloat(product.volume.replace(/[^\d.]/g, ''));
      if (!isNaN(parsedVolume)) {
        capacityLiters = parsedVolume;
      }
    }

    return stockRow.available_liters < capacityLiters;
  })();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-earth-dark">
        <div className="animate-pulse flex flex-col items-center">
          <Droplet className="w-12 h-12 text-mustard-500 mb-4 animate-bounce" />
          <p className="text-slate-500 font-semibold">Locating Product Pipeline...</p>
        </div>
      </div>
    );
  }

  const price = getPriceForUser(product);

  const handleAddToCart = () => {
    // Since cart adds 1 by default, loop for specific quantity.
    // In a real expanded app, addToCart would take a quantity param.
    for(let i=0; i<quantity; i++){
       addToCart(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark">
      <div className="container mx-auto px-6 lg:px-12">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-8 uppercase tracking-widest">
           <Link to="/" className="hover:text-mustard-500 transition-colors">Home</Link>
           <ChevronRight className="w-4 h-4" />
           <Link to="/shop" className="hover:text-mustard-500 transition-colors">Shop</Link>
           <ChevronRight className="w-4 h-4" />
           <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Product Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
           
           {/* Image Gallery */}
           <div className="flex flex-col md:flex-row gap-4 h-full max-h-[600px]">
             {/* Thumbnail Strip */}
             <div className="flex flex-row md:flex-col gap-4 order-2 md:order-1 overflow-x-auto overflow-y-hidden md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
               {product.thumbnails.map((img, idx) => (
                 <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 flex-shrink-0 rounded-2xl border-2 overflow-hidden bg-white dark:bg-black/20 ${activeImage === idx ? 'border-mustard-500' : 'border-slate-200 dark:border-white/10 opacity-60 hover:opacity-100'} transition-all`}
                 >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-contain p-2" />
                 </button>
               ))}
             </div>
             
             {/* Main Image Stage */}
             <div className="flex-1 rounded-3xl bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 order-1 md:order-2 relative overflow-hidden flex items-center justify-center p-8 group">
                <div className={`absolute inset-0 bg-gradient-to-tr ${product.color} opacity-10 mix-blend-multiply`} />
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImage}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={product.thumbnails[activeImage]} 
                    alt={product.name}
                    className="w-full h-auto max-h-full object-contain relative z-10 drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
                  />
                </AnimatePresence>
                
                {/* Labels */}
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                   {!isOutOfStock ? (
                     <span className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs font-bold px-3 py-1 rounded-full w-max">IN STOCK</span>
                   ) : (
                     <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold px-3 py-1 rounded-full w-max">OUT OF STOCK</span>
                   )}
                   <span className="bg-slate-900/10 dark:bg-white/10 text-slate-800 dark:text-slate-200 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border border-white/20 w-max bg-white/50">{product.volume} Pack</span>
                </div>
             </div>
           </div>

           {/* Product Info Setup */}
           <div className="flex flex-col py-4">
             <div className="mb-2 flex items-center gap-2">
               <span className="text-mustard-600 dark:text-mustard-400 font-bold text-sm tracking-widest uppercase">{product.subtitle}</span>
               {isShopkeeper && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-sm">B2B RATE</span>}
             </div>
             
             <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4 leading-tight">
               {product.name}
             </h1>

             {/* Rating */}
             <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center bg-mustard-500 text-white px-2 py-1 rounded-lg font-bold text-sm gap-1">
                   {product.rating} <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-mustard-500 cursor-pointer transition">
                  {product.reviews.toLocaleString()} verified ratings
                </span>
             </div>

             {/* Price block */}
             <div className="mb-8">
               <p className="text-5xl font-display font-bold text-slate-900 dark:text-white mb-1">
                 ₹{price}
               </p>
               {isShopkeeper && <p className="text-sm font-semibold text-slate-500 line-through">Standard MRP: ₹{product.retailPrice}</p>}
               <p className="text-xs text-slate-500 mt-2 font-medium">Inclusive of all factory taxes.</p>
             </div>

             {/* Features Highlights */}
             <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
               {product.features.map((f, i) => (
                 <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-mustard-500 flex-shrink-0" />
                    {f}
                 </li>
               ))}
             </ul>

             {/* Actions */}
              {user ? (
                user.role !== 'admin' ? (
                  isOutOfStock ? (
                    <div className="flex flex-col gap-4 mt-auto">
                      <button 
                        disabled
                        className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 cursor-not-allowed"
                      >
                        Out of Stock / Production Paused
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                      <div className="flex items-center border-2 border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden h-14 w-full sm:w-32">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 h-full bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-lg transition font-medium">-</button>
                        <div className="flex-1 text-center font-bold text-lg dark:text-white">{quantity}</div>
                        <button onClick={() => setQuantity(quantity + 1)} className="px-4 h-full bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-lg transition font-medium">+</button>
                      </div>
                      
                      <button 
                        onClick={handleAddToCart}
                        className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all interactive shadow-lg
                          ${added ? 'bg-green-500 text-white' : 'bg-mustard-500 hover:bg-mustard-600 text-slate-900'}
                        `}
                      >
                        {added ? <><CheckCircle className="w-5 h-5"/> Added to Cart</> : <><ShoppingBag className="w-5 h-5" /> Add to Cart</>}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="mt-auto py-4 px-6 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center flex flex-col justify-center h-14">
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">Admin Preview Mode</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-4 mt-auto">
                  <Link 
                    to="/login"
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg bg-mustard-500 hover:bg-mustard-600 text-slate-900 shadow-lg interactive transition-all text-center"
                  >
                    <LogIn className="w-5 h-5" /> Sign In to Purchase
                  </Link>
                </div>
              )}
           </div>
        </div>

        {/* Detailed Tabs Section */}
        <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
           <div className="flex border-b border-slate-100 dark:border-white/10 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('description')}
                className={`py-6 px-10 font-bold text-sm uppercase tracking-widest transition-colors flex-shrink-0
                  ${activeTab === 'description' ? 'text-mustard-600 dark:text-mustard-400 border-b-2 border-mustard-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}
                `}
              >
                Full Description
              </button>
              <button 
                onClick={() => setActiveTab('nutrition')}
                className={`py-6 px-10 font-bold text-sm uppercase tracking-widest transition-colors flex-shrink-0
                  ${activeTab === 'nutrition' ? 'text-mustard-600 dark:text-mustard-400 border-b-2 border-mustard-500' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}
                `}
              >
                Nutritional Facts
              </button>
           </div>
           
           <div className="p-8 md:p-12 min-h-[300px]">
             {activeTab === 'description' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose dark:prose-invert max-w-none">
                 <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                   {product.description}
                 </p>
               </motion.div>
             )}
             
             {activeTab === 'nutrition' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                 {Object.entries(product.nutrition).map(([key, val], i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">{key}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{val}</span>
                    </div>
                 ))}
                 <p className="col-span-1 md:col-span-2 text-xs text-slate-400 mt-4">*Approximate nutritional value per 100g of serving.</p>
               </motion.div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
