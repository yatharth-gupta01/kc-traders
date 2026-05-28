import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Package, CheckCircle, XCircle } from 'lucide-react';

const WHOLESALE_RATES = {
  'Kacchi Ghani': { id: 'kcm-01-bulk', name: 'Kacchi Ghani Mustard Oil', rate: 140 },
  'Premium Filtered': { id: 'kcm-02-bulk', name: 'Premium Filtered Mustard Oil', rate: 125 },
  'Yellow Mustard': { id: 'kcm-05-bulk', name: 'Yellow Mustard Oil', rate: 160 }
};

import { productsData } from '../data/products';

const Shop = () => {
  const { user } = useAuth();
  const { addToCart, getPriceForUser } = useCart();

  const isShopkeeper = user?.role === 'shopkeeper';

  const [volumeFilter, setVolumeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('none'); // 'low', 'high'
  const [stockList, setStockList] = useState([]);
  
  // Direct Bulk Purchase States
  const [directOilType, setDirectOilType] = useState('Kacchi Ghani');
  const [directQuantity, setDirectQuantity] = useState('');
  const [directPayment, setDirectPayment] = useState('COD');
  const [toast, setToast] = useState(null);
  
  // Saved Addresses Integration
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Detailed New Address Form States
  const [newAddrName, setNewAddrName] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrPincode, setNewAddrPincode] = useState('');
  const [saveToBook, setSaveToBook] = useState(false);

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

  const fetchAddresses = async () => {
    if (!user || !user.token) return;
    try {
      const res = await fetch('http://localhost:5000/api/addresses', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id.toString());
        } else {
          setSelectedAddressId('new');
        }
      }
    } catch (e) {
      console.error("Failed to fetch addresses.", e);
    }
  };

  useEffect(() => {
    if (user && user.role === 'shopkeeper') {
      fetchAddresses();
    }
  }, [user]);

  const handleDirectPurchase = async (e) => {
    e.preventDefault();
    const qty = parseFloat(directQuantity);
    if (isNaN(qty) || qty <= 15) {
      triggerToast("Minimum purchase quantity must be greater than 15 L.", "error");
      return;
    }

    let finalAddress = '';
    
    if (selectedAddressId === 'new') {
      if (!newAddrName.trim() || !newAddrPhone.trim() || !newAddrLine.trim() || !newAddrCity.trim() || !newAddrState.trim() || !newAddrPincode.trim()) {
        triggerToast("Please fill in all address details.", "error");
        return;
      }
      finalAddress = `${newAddrName}, ${newAddrPhone}, ${newAddrLine}, ${newAddrCity}, ${newAddrState} - ${newAddrPincode}`;
      
      if (saveToBook) {
        try {
          await fetch('http://localhost:5000/api/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              name: newAddrName,
              phone: newAddrPhone,
              address: newAddrLine,
              city: newAddrCity,
              state: newAddrState,
              pincode: newAddrPincode
            })
          });
          fetchAddresses();
        } catch (err) {
          console.error("Failed to save address to address book", err);
        }
      }
    } else {
      const selected = savedAddresses.find(a => a.id.toString() === selectedAddressId);
      if (!selected) {
        triggerToast("Please select or enter a valid delivery address.", "error");
        return;
      }
      finalAddress = `${selected.name}, ${selected.phone}, ${selected.address}, ${selected.city}, ${selected.state} - ${selected.pincode}`;
    }

    const orderId = `KCW-${Math.floor(100000 + Math.random() * 900000)}`;
    const selectedItem = WHOLESALE_RATES[directOilType];

    const orderData = {
      id: orderId,
      address: finalAddress,
      items: [{
        id: selectedItem.id,
        name: `${selectedItem.name} (${qty}L Bulk)`,
        volume: `${qty}L`,
        price: selectedItem.rate * qty,
        quantity: 1,
        image: "/assets/product_oil.png"
      }],
      total: qty * selectedItem.rate,
      paymentMethod: directPayment
    };

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(orderData)
      });
      
      if (res.ok) {
        setDirectQuantity('');
        if (selectedAddressId === 'new') {
          setNewAddrName('');
          setNewAddrPhone('');
          setNewAddrLine('');
          setNewAddrCity('');
          setNewAddrState('');
          setNewAddrPincode('');
          setSaveToBook(false);
        }
        triggerToast("Bulk wholesale order placed successfully!");
      } else {
        const errorData = await res.json();
        triggerToast(errorData.error || "Failed to place bulk order.", "error");
      }
    } catch (e) {
      triggerToast("Failed to place bulk order.", "error");
    }
  };

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

  const selectedRate = WHOLESALE_RATES[directOilType].rate;
  const totalCost = directQuantity ? parseFloat(directQuantity) * selectedRate : 0;

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

        {/* Shopkeeper Direct Bulk Wholesale Form */}
        {isShopkeeper && (
          <div className="glass-card bg-white dark:bg-black/30 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm mb-12 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-mustard-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Direct Bulk Wholesale Purchase</h2>
            </div>
            
            <form onSubmit={handleDirectPurchase} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Select Oil Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.keys(WHOLESALE_RATES).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDirectOilType(type)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          directOilType === type
                            ? 'bg-mustard-500 border-mustard-500 text-white shadow-lg shadow-mustard-500/25'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-mustard-500'
                        }`}
                      >
                        {type}
                        <span className="block text-[10px] opacity-75 mt-1 font-medium">₹{WHOLESALE_RATES[type].rate}/L</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Quantity (Liters)</label>
                  <input
                    type="number"
                    min="16"
                    step="any"
                    placeholder="Enter quantity (> 15 L)"
                    value={directQuantity}
                    onChange={(e) => setDirectQuantity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mustard-500 text-sm font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Must be strictly greater than 15 L</p>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Payment Method</label>
                  <div className="flex gap-4">
                    {['COD', 'UPI'].map((method) => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 font-semibold">
                        <input
                          type="radio"
                          name="payment"
                          value={method}
                          checked={directPayment === method}
                          onChange={(e) => setDirectPayment(e.target.value)}
                          className="text-mustard-500 focus:ring-mustard-500"
                        />
                        {method}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Shipping Delivery Address</label>
                  
                  {savedAddresses.length > 0 && (
                    <div className="mb-3">
                      <select
                        value={selectedAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-mustard-500"
                      >
                        {savedAddresses.map(addr => (
                          <option key={addr.id} value={addr.id.toString()}>
                            {addr.name} ({addr.city}) - {addr.address.substring(0, 35)}...
                          </option>
                        ))}
                        <option value="new">+ Enter New Address</option>
                      </select>
                    </div>
                  )}

                  {(savedAddresses.length === 0 || selectedAddressId === 'new') && (
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Recipient Name"
                          value={newAddrName}
                          onChange={(e) => setNewAddrName(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-earth-dark border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={newAddrPhone}
                          onChange={(e) => setNewAddrPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-earth-dark border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Street Address, Landmark, etc."
                        value={newAddrLine}
                        onChange={(e) => setNewAddrLine(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-earth-dark border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                        required
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                          className="w-full px-2 py-2 text-[10px] rounded-lg bg-white dark:bg-earth-dark border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                          required
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={newAddrState}
                          onChange={(e) => setNewAddrState(e.target.value)}
                          className="w-full px-2 py-2 text-[10px] rounded-lg bg-white dark:bg-earth-dark border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={newAddrPincode}
                          onChange={(e) => setNewAddrPincode(e.target.value)}
                          className="w-full px-2 py-2 text-[10px] rounded-lg bg-white dark:bg-earth-dark border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold"
                          required
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400 font-semibold select-none">
                        <input
                          type="checkbox"
                          checked={saveToBook}
                          onChange={(e) => setSaveToBook(e.target.checked)}
                          className="rounded text-mustard-500 focus:ring-mustard-500 w-4.5 h-4.5 bg-white border-slate-200"
                        />
                        Save to Address Book for future orders
                      </label>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Estimated Cost</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-mustard-400">₹{totalCost.toLocaleString()}</p>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-mustard-600 to-mustard-500 text-white font-bold rounded-xl shadow-lg shadow-mustard-500/25 hover:opacity-90 active:scale-95 transition-all text-sm"
                  >
                    Place Wholesale Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

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

      {/* Global Animated Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-10 right-10 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border ${
              toast.type === 'error' 
                ? 'bg-red-500/90 text-white border-red-400' 
                : 'bg-green-500/90 text-white border-green-400'
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
