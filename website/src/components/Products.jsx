import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products = () => {
  const products = [
    {
      id: 1,
      name: "Kacchi Ghani Mustard Oil",
      subtitle: "Cold-Pressed & 100% Pure",
      image: "/assets/product_oil.png",
      description: "Extracted using traditional cold-pressed methods to retain the natural pungency, original flavor, and health benefits of mustard seeds.",
      features: ['Rich Aroma', 'High Pungency', 'Zero Argemone Oil'],
      color: "from-mustard-600 to-mustard-400"
    },
    {
      id: 2,
      name: "Premium Filtered Mustard Oil",
      subtitle: "Refined for Everyday Cooking",
      image: "/assets/product_filtered.png",
      description: "Carefully filtered to remove impurities while preserving the essential nutrients, making it ideal for deep frying and daily household cooking.",
      features: ['Light Taste', 'High Smoke Point', 'Heart Healthy'],
      color: "from-amber-600 to-amber-400"
    }
  ];

  return (
    <section id="products" className="py-24 bg-white dark:bg-[#231710] relative">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Our Premium <span className="text-gradient">Products</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Discover the liquid gold of Agra. We produce different variants to suit your specific culinary, health, and traditional needs.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-center gap-10 lg:gap-16">
          {products.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group relative w-full lg:w-[450px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 dark:opacity-0 transition-opacity duration-500 rounded-3xl blur-xl" />
              
              <div className="relative h-full glass-card border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2 flex flex-col bg-slate-50 dark:bg-earth-dark/50">
                
                {/* Product Image area */}
                <div className="h-96 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-t ${product.color} opacity-40 mix-blend-multiply z-10`} />
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">100% Pure</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <p className="text-mustard-600 dark:text-mustard-400 font-semibold text-sm mb-2">{product.subtitle}</p>
                  <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">{product.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 flex-grow">{product.description}</p>
                  
                  <ul className="flex flex-col gap-2 mb-8">
                    {product.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <ShieldCheck className="w-4 h-4 text-mustard-500" /> {f}
                      </li>
                    ))}
                  </ul>

                  <Link 
                    to="/shop"
                    className="w-full py-3 text-center block rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-mustard-500 dark:hover:bg-mustard-600 dark:text-slate-900 text-white font-semibold transition-colors interactive"
                  >
                    View Prices & Buy
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
