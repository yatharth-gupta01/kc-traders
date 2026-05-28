import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Truck, CreditCard, ChevronRight, CheckCircle2, ShieldCheck } from 'lucide-react';

const Checkout = () => {
  const { cartItems, getCartTotal, getPriceForUser } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to shop if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pincode: '',
    state: '',
    city: '',
    address: '',
    paymentMethod: 'cod'
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState('');

  // Fetch Saved Addresses on mount (Flipkart-Style)
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!user || !user.token) return;
      try {
        const res = await fetch('http://localhost:5000/api/addresses', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSavedAddresses(data);
          // Auto-select the most recent address by default (like Flipkart!)
          if (data.length > 0) {
            setSelectedAddressId(data[0].id);
            setFormData(prev => ({
              ...prev,
              name: data[0].name,
              phone: data[0].phone,
              pincode: data[0].pincode,
              state: data[0].state,
              city: data[0].city,
              address: data[0].address
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch saved addresses:", error);
      }
    };
    fetchSavedAddresses();
  }, [user]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData(prev => ({
      ...prev,
      name: addr.name,
      phone: addr.phone,
      pincode: addr.pincode,
      state: addr.state,
      city: addr.city,
      address: addr.address
    }));
  };

  const handleSelectNewAddressOption = () => {
    setSelectedAddressId('new');
    setFormData(prev => ({
      ...prev,
      name: '',
      phone: '',
      pincode: '',
      state: '',
      city: '',
      address: ''
    }));
  };

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 1500 ? 0 : 50; // Free delivery over ₹1500
  const grandTotal = subtotal + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Automatically trigger pincode logic when exactly 6 digits are typed
    if (name === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
      fetchPincodeDetails(value);
    } else if (name === 'pincode') {
      // Clear auto-filled locations if pincode shrinks
      setPincodeMessage('');
    }
  };

  const fetchPincodeDetails = async (pin) => {
    try {
      setPincodeMessage('Fetching details...');
      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await response.json();
      
      if (data && data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        setFormData(prev => ({
          ...prev,
          state: postOffice.State,
          city: postOffice.District
        }));
        setPincodeMessage('Location found successfully!');
        setTimeout(() => setPincodeMessage(''), 3000);
      } else {
        setPincodeMessage('Invalid Pincode. Please check again.');
      }
    } catch (error) {
      setPincodeMessage('Could not fetch location data.');
    }
  };

  const fetchGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    setPincodeMessage('Acquiring GPS coordinates...');

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Send coordinates to OpenStreetMap Nominatim reverse geocoding API
      try {
        setPincodeMessage('Resolving exact address...');
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data && data.address) {
          // Extract postal code from multiple possible OpenStreetMap fields
          let fetchedPincode = data.address.postcode || data.address.postal_code || data.address.postalCode || '';
          fetchedPincode = fetchedPincode.replace(/\D/g, ''); // Extract only numeric digits
          
          // Fallback: Try to extract a 6-digit Indian PIN code from display_name
          if (!fetchedPincode) {
            const displayMatch = data.display_name.match(/\b\d{6}\b/);
            if (displayMatch) {
              fetchedPincode = displayMatch[0];
            }
          }

          setFormData(prev => ({
            ...prev,
            pincode: fetchedPincode,
            state: data.address.state || '',
            city: data.address.state_district || data.address.city || data.address.town || '',
            address: `${data.address.road || ''}, ${data.address.suburb || ''}`.replace(/^, | ,/g, '').trim() || data.display_name
          }));
          
          if (fetchedPincode && fetchedPincode.length === 6) {
             fetchPincodeDetails(fetchedPincode);
          } else {
             setPincodeMessage('Location found! Please enter Pincode manually.');
          }
        } else {
          setPincodeMessage('Could not resolve readable address from GPS.');
        }
      } catch (error) {
        setPincodeMessage('Error geocoding your location.');
      } finally {
        setIsFetchingLocation(false);
      }
    }, () => {
      setIsFetchingLocation(false);
      setPincodeMessage('Location access denied or failed.');
      alert('Unable to retrieve your location. Please check browser permissions.');
    }, { timeout: 10000 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || (!user.token && user.role !== 'admin')) {
      alert("Please log in to place an order.");
      return;
    }
    if (!formData.name || !formData.phone || !formData.pincode || formData.pincode.length !== 6 || !formData.address) {
      alert("Please accurately fill all required delivery details.");
      return;
    }
    const orderId = `ORD-KCT-${Math.floor(Math.random() * 90000) + 10000}`;
    const orderPayload = {
      id: orderId,
      address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode} (Ph: ${formData.phone})`,
      items: cartItems,
      total: grandTotal,
      paymentMethod: formData.paymentMethod
    };

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        // Automatically save the address to their Address Book in the background
        try {
          await fetch('http://localhost:5000/api/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              name: formData.name,
              phone: formData.phone,
              pincode: formData.pincode,
              state: formData.state,
              city: formData.city,
              address: formData.address
            })
          });
        } catch (addrErr) {
          console.error("Background address save failed:", addrErr);
        }
        
        navigate('/order-success', { state: { orderId } });
      } else {
        alert("Server rejected the order. Are you logged in securely?");
      }
    } catch (error) {
      alert("Failed to securely reach the database server.");
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark selection:bg-mustard-500 selection:text-white">
      <div className="container mx-auto px-6 lg:px-12">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-8">Secure Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column - Forms */}
          <div className="flex-1 space-y-8">
            
            {/* Address Wrapper */}
            <form onSubmit={handleSubmit} id="checkoutForm" className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <MapPin className="text-mustard-500 w-6 h-6" /> Delivery Address
                </h2>
                
                <button
                  type="button"
                  onClick={fetchGPSLocation}
                  disabled={isFetchingLocation}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white dark:text-slate-200 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 interactive"
                >
                  <Navigation className={`w-4 h-4 ${isFetchingLocation ? 'animate-pulse text-mustard-400' : ''}`} /> 
                  {isFetchingLocation ? 'Locating...' : 'Use Current Location'}
                </button>
              </div>

              {/* Saved Addresses Section (Flipkart-Style) */}
              {savedAddresses.length > 0 && (
                <div className="mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-4">
                    Select a Saved Address (Flipkart-Style Address Book)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          selectedAddressId === addr.id 
                            ? 'border-mustard-500 bg-mustard-50/50 dark:bg-mustard-900/10 shadow-sm' 
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-black/10'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-900 dark:text-white capitalize">{addr.name}</span>
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedAddressId === addr.id ? 'border-mustard-500 bg-mustard-500' : 'border-slate-300 dark:border-white/20'
                            }`}>
                              {selectedAddressId === addr.id && <span className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full" />}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ph: {addr.phone}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </div>
                    ))}

                    {/* Use a New Address Option */}
                    <div 
                      onClick={handleSelectNewAddressOption}
                      className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center ${
                        selectedAddressId === 'new' 
                          ? 'border-mustard-500 bg-mustard-50/50 dark:bg-mustard-900/10 shadow-sm' 
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-black/10'
                      }`}
                    >
                      <div className="text-center">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mx-auto mb-2 ${
                          selectedAddressId === 'new' ? 'border-mustard-500 bg-mustard-500' : 'border-slate-300 dark:border-white/20'
                        }`}>
                          {selectedAddressId === 'new' && <span className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full" />}
                        </span>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Use a New Address</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Fill in the delivery details below.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white" placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobile Number</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white" placeholder="9876543210" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pincode</label>
                <input 
                  type="text" 
                  name="pincode" 
                  required 
                  maxLength={6}
                  value={formData.pincode} 
                  onChange={handleChange} 
                  className="w-full md:w-1/2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white" 
                  placeholder="6-digit PIN (e.g., 282001)" 
                />
                {pincodeMessage && (
                  <p className={`text-xs mt-2 font-medium ${pincodeMessage.includes('Successfully') || pincodeMessage.includes('found') ? 'text-green-600 dark:text-green-400' : 'text-mustard-600 dark:text-mustard-400'}`}>
                    {pincodeMessage}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">State/Province</label>
                  <input type="text" name="state" required value={formData.state} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#1a120c] border border-slate-200 dark:border-white/10 font-medium text-slate-700 dark:text-slate-400" placeholder="Auto-filled via Pincode" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City/District</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#1a120c] border border-slate-200 dark:border-white/10 font-medium text-slate-700 dark:text-slate-400" placeholder="Auto-filled via Pincode" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Delivery Address (House No, Building, Street, Area)</label>
                <textarea 
                  name="address" 
                  required 
                  rows="3"
                  value={formData.address} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white resize-none" 
                  placeholder="Enter exact delivery instructions" 
                />
              </div>
            </form>

            {/* Payment Method */}
            <div className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
               <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
                <CreditCard className="text-mustard-500 w-6 h-6" /> Payment Method
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-mustard-500 bg-mustard-50 dark:bg-mustard-900/20' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} className="sr-only" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">Cash on Delivery <CheckCircle2 className={`w-4 h-4 ${formData.paymentMethod === 'cod' ? 'text-mustard-500' : 'opacity-0'}`} /></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pay with cash upon package arrival.</p>
                    </div>
                  </label>

                  <label className={`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'online' ? 'border-mustard-500 bg-mustard-50 dark:bg-mustard-900/20' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
                    <input type="radio" name="paymentMethod" value="online" checked={formData.paymentMethod === 'online'} onChange={handleChange} className="sr-only" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">Pay Online <CheckCircle2 className={`w-4 h-4 ${formData.paymentMethod === 'online' ? 'text-mustard-500' : 'opacity-0'}`} /></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">UPI, Credit/Debit Cards, NetBanking.</p>
                    </div>
                  </label>
               </div>
            </div>

          </div>

          {/* Right Column - Order Summary Widget */}
          <div className="w-full lg:w-[400px]">
            <div className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl sticky top-32">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-white/10 pb-4">Order Summary</h2>
               
               <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                 {cartItems.map(item => (
                   <div key={item.id} className="flex gap-4">
                     <div className="w-16 h-16 bg-slate-50 dark:bg-earth-dark rounded-lg flex items-center justify-center border border-slate-100 dark:border-white/5 flex-shrink-0">
                       <img src={item.image} alt="" className="h-10 object-contain" />
                     </div>
                     <div className="flex-1 text-sm">
                       <p className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{item.name}</p>
                       <p className="text-slate-500 mt-1">Qty: {item.quantity}</p>
                     </div>
                     <p className="text-sm font-bold text-slate-900 dark:text-mustard-400">₹{getPriceForUser(item) * item.quantity}</p>
                   </div>
                 ))}
               </div>

               <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-6 border-t border-slate-100 dark:border-white/10 pt-6">
                 <div className="flex justify-between">
                   <span>Subtotal</span>
                   <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="flex items-center gap-1"><Truck className="w-4 h-4"/> Standard Delivery</span>
                   <span className="font-semibold text-slate-900 dark:text-white">{deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
                 </div>
                 {deliveryFee !== 0 && (
                   <p className="text-xs text-mustard-600 dark:text-mustard-400">Add ₹{1500 - subtotal} more for free delivery!</p>
                 )}
               </div>

               <div className="flex justify-between items-end mb-8 pt-4 border-t border-slate-100 dark:border-white/10">
                 <span className="text-lg font-bold text-slate-900 dark:text-white">Total Amount</span>
                 <span className="text-3xl font-bold text-mustard-600 dark:text-mustard-400">₹{grandTotal}</span>
               </div>

               {/* Ties to the form above */}
               <button 
                 type="submit" 
                 form="checkoutForm"
                 className="w-full py-4 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 interactive"
               >
                 Place Order <ChevronRight className="w-5 h-5" />
               </button>
               <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                 <ShieldCheck className="w-3 h-3" /> Secure highly encrypted transaction.
               </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Checkout;
