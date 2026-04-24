import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

// Product Catalog Database
export const productsData = [
  {
    id: 'kcm-01',
    name: "Kacchi Ghani Mustard Oil (1L Bottle)",
    subtitle: "Cold-Pressed & 100% Pure",
    image: "/assets/product_oil.png",
    description: "Extracted using traditional methods to retain natural pungency.",
    retailPrice: 180,
    wholesalePrice: 140, // Discounted
    color: "from-mustard-600 to-mustard-400"
  },
  {
    id: 'kcm-02',
    name: "Premium Filtered Mustard Oil (1L Bottle)",
    subtitle: "Refined for Everyday Cooking",
    image: "/assets/product_filtered.png",
    description: "Filtered perfectly for deep frying and daily household cooking.",
    retailPrice: 160,
    wholesalePrice: 125, // Discounted
    color: "from-amber-600 to-amber-400"
  },
  {
    id: 'kcm-03',
    name: "Kacchi Ghani Mustard Oil (5L Can)",
    subtitle: "Bulk Cold-Pressed",
    image: "/assets/product_oil.png",
    description: "Family pack of our signature pure cold-pressed oil.",
    retailPrice: 850,
    wholesalePrice: 680, // Discounted
    color: "from-mustard-600 to-mustard-400"
  },
  {
    id: 'kcm-04',
    name: "Premium Filtered Mustard Oil (15L Tin)",
    subtitle: "Commercial/Wholesale Packaging",
    image: "/assets/product_filtered.png",
    description: "15L bulk tin preferred by restaurants and local vendors.",
    retailPrice: 2300,
    wholesalePrice: 1800, // Highly Discounted
    color: "from-amber-600 to-amber-400"
  }
];

const Shop = () => {
  const { user } = useAuth();
  const { addToCart, getPriceForUser } = useCart();

  const isShopkeeper = user?.role === 'shopkeeper';

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {productsData.map((product, idx) => {
            const price = getPriceForUser(product);
            const originalPrice = product.retailPrice;

            return (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="h-64 relative overflow-hidden bg-slate-100 dark:bg-earth-dark p-6 flex justify-center">
                  <div className={`absolute inset-0 bg-gradient-to-t ${product.color} opacity-20 mix-blend-multiply z-10`} />
                  <img src={product.image} alt={product.name} className="h-full w-auto object-contain z-20 group-hover:scale-110 transition-transform duration-500" />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <p className="text-mustard-600 dark:text-mustard-400 font-semibold text-xs mb-2 uppercase tracking-wide">{product.subtitle}</p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{product.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-grow">{product.description}</p>
                  
                  <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      {isShopkeeper && <p className="text-xs text-slate-400 line-through">₹{originalPrice}</p>}
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        ₹{price} <span className="text-xs font-normal text-slate-500">/{product.id.includes('15L') ? 'Tin' : 'Unit'}</span>
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-12 h-12 bg-slate-900 hover:bg-mustard-500 dark:bg-mustard-500 dark:hover:bg-mustard-600 text-white dark:text-slate-900 rounded-xl flex items-center justify-center transition-colors interactive shadow-md"
                      aria-label="Add to cart"
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Shop;
