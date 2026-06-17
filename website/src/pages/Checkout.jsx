import { API_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Navigation, Truck, ChevronRight, 
  ShieldCheck, Loader2, ChevronLeft, ArrowRight, CreditCard, Banknote 
} from 'lucide-react';

const Checkout = () => {
  const { cartItems, getCartTotal } = useCart();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mobile Stepped Navigation State
  const [activeStep, setActiveStep] = useState(1); // 1: Address, 2: Synopsis, 3: Payment

  // Fetch Saved Addresses on mount
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!user || !user.token) return;
      try {
        const res = await fetch(`${API_URL}/addresses`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSavedAddresses(data);
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
  const deliveryFee = subtotal > 1500 ? 0 : 50; 
  const grandTotal = subtotal + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'pincode' && value.length === 6 && /^\d+$/.test(value)) {
      fetchPincodeDetails(value);
    } else if (name === 'pincode') {
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
      
      try {
        setPincodeMessage('Resolving exact address...');
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data && data.address) {
          let fetchedPincode = data.address.postcode || data.address.postal_code || data.address.postalCode || '';
          fetchedPincode = fetchedPincode.replace(/\D/g, ''); 
          
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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Secure checkout handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!user || (!user.token && user.role !== 'admin')) {
      alert("Please log in to place an order.");
      return;
    }
    if (!formData.name || !formData.phone || !formData.pincode || formData.pincode.length !== 6 || !formData.address) {
      alert("Please accurately fill all required delivery details.");
      return;
    }

    setIsProcessing(true);

    const orderId = `ORD-KCT-${Math.floor(Math.random() * 90000) + 10000}`;
    const addressString = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode} (Ph: ${formData.phone})`;

    if (formData.paymentMethod === 'cod') {
      // Standard COD Path
      const orderPayload = {
        id: orderId,
        address: addressString,
        items: cartItems,
        total: grandTotal,
        paymentMethod: 'cod'
      };

      try {
        const res = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(orderPayload)
        });
        
        if (res.ok) {
          await saveAddressToBook();
          navigate('/order-success', { state: { orderId, paymentMethod: 'cod' } });
        } else {
          handleRequestError(res);
        }
      } catch (error) {
        alert("Failed to securely reach the database server.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Online Payment Path (Razorpay)
      try {
        // 1. Create Razorpay order on backend
        const orderRes = await fetch(`${API_URL}/payments/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ amount: grandTotal })
        });

        if (!orderRes.ok) {
          throw new Error('Failed to initiate online payment order');
        }

        const rzpOrder = await orderRes.json();

        // 2. Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Failed to load payment gateway SDK. Please check your internet connection.");
          setIsProcessing(false);
          return;
        }

        // 3. Open Razorpay checkout with UPI disabled
        const options = {
          key: 'rzp_test_SwK3h7FctY3Mlc',
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'K.C. Traders',
          description: 'Pure Mustard Oil Purchase',
          order_id: rzpOrder.id,
          handler: async function (response) {
            try {
              setIsProcessing(true);
              // 4. Verify payment signature on backend
              const verifyRes = await fetch(`${API_URL}/payments/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              if (verifyRes.ok) {
                // 5. Save final order to db
                const orderPayload = {
                  id: orderId,
                  address: addressString,
                  items: cartItems,
                  total: grandTotal,
                  paymentMethod: 'online'
                };

                const finalRes = await fetch(`${API_URL}/orders`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  },
                  body: JSON.stringify(orderPayload)
                });

                if (finalRes.ok) {
                  await saveAddressToBook();
                  navigate('/order-success', { state: { orderId, paymentMethod: 'online' } });
                } else {
                  alert("Payment verified, but failed to save order details. Please contact support.");
                }
              } else {
                alert("Payment verification failed. Security mismatch.");
              }
            } catch (err) {
              console.error(err);
              alert("Error occurred during payment verification.");
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: formData.name,
            contact: formData.phone
          },
          theme: {
            color: '#eab308'
          },
          method: {
            upi: false, // Hides/disables UPI payment option
            card: true,
            netbanking: true,
            wallet: true
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (error) {
        console.error(error);
        alert(error.message || "Failed to initialize payment gateway.");
        setIsProcessing(false);
      }
    }
  };

  const saveAddressToBook = async () => {
    try {
      await fetch(`${API_URL}/addresses`, {
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
    } catch (e) {
      console.error("Failed to auto-save address:", e);
    }
  };

  const handleRequestError = (res) => {
    if (res.status === 401 || res.status === 403) {
      alert("Your login session has expired for security. Please log in again to complete your order.");
      logout();
      navigate('/login');
    } else {
      alert("Server rejected your order. Please login securely again.");
    }
  };

  // ----------------------------------------------------
  // STEP-BY-STEP MOBILE RENDER
  // ----------------------------------------------------
  const renderMobileCheckout = () => {
    const nextStep = () => {
      if (activeStep === 1) {
        if (!formData.name || !formData.phone || !formData.pincode || formData.pincode.length !== 6 || !formData.address) {
          alert("Please fill all required delivery details.");
          return;
        }
      }
      setActiveStep(activeStep + 1);
    };

    const prevStep = () => {
      setActiveStep(activeStep - 1);
    };

    return (
      <div className="min-h-screen pt-24 pb-28 bg-[#f8f9fa] dark:bg-[#0c0806] text-slate-900 dark:text-white flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-black/20 border-b border-slate-100 dark:border-white/5 flex items-center gap-4 relative z-10 backdrop-blur-xl">
          <button 
            onClick={() => activeStep > 1 ? prevStep() : navigate('/cart')}
            className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 active:scale-95 text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-black">Checkout</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Step {activeStep} of 3</p>
          </div>
        </div>

        {/* Progress steps timeline */}
        <div className="px-6 py-3 bg-white dark:bg-black/10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
          <span className={activeStep === 1 ? 'text-mustard-500' : 'text-green-500'}>Address</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={activeStep === 2 ? 'text-mustard-500' : activeStep > 2 ? 'text-green-500' : ''}>Synopsis</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className={activeStep === 3 ? 'text-mustard-500' : ''}>Payment</span>
        </div>

        <div className="flex-grow p-6 space-y-6 overflow-y-auto max-w-xl mx-auto w-full">
          {/* STEP 1: ADDRESS */}
          {activeStep === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Location acquisition */}
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Acreage Pin</p>
                <button
                  onClick={fetchGPSLocation}
                  disabled={isFetchingLocation || isProcessing}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white dark:text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isFetchingLocation ? 'animate-pulse text-mustard-400' : ''}`} /> 
                  GPS Auto-Fill
                </button>
              </div>

              {pincodeMessage && (
                <div className="bg-mustard-500/10 border border-mustard-500/20 text-mustard-600 dark:text-mustard-400 text-xs py-2 px-4 rounded-xl font-bold text-center">
                  {pincodeMessage}
                </div>
              )}

              {/* Saved addresses carousel */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Saved Address Books</p>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {savedAddresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`w-64 flex-shrink-0 p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          selectedAddressId === addr.id 
                            ? 'border-mustard-500 bg-mustard-500/5 shadow-sm' 
                            : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#120d0a]'
                        }`}
                      >
                        <div>
                          <p className="font-black text-xs text-slate-900 dark:text-white uppercase truncate">{addr.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">{addr.address}, {addr.city}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-3">Phone: {addr.phone}</p>
                      </div>
                    ))}
                    <div 
                      onClick={handleSelectNewAddressOption}
                      className={`w-40 flex-shrink-0 p-4 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer ${
                        selectedAddressId === 'new' ? 'border-mustard-500 bg-mustard-500/5 text-mustard-500' : 'border-slate-300 dark:border-white/10 text-slate-400'
                      }`}
                    >
                      <MapPin className="w-6 h-6 mb-1.5" />
                      <span className="text-xs font-black uppercase tracking-wider">New Address</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Form */}
              <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 dark:border-white/5">Delivery Coordinates</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Full Name</label>
                    <input 
                      type="text" name="name" required value={formData.name} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs focus:ring-1 focus:ring-mustard-500 focus:outline-none dark:text-white"
                      placeholder="Rahul Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Contact Phone</label>
                    <input 
                      type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs focus:ring-1 focus:ring-mustard-500 focus:outline-none dark:text-white font-mono"
                      placeholder="9999999999"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Pincode</label>
                      <input 
                        type="text" name="pincode" maxLength="6" required value={formData.pincode} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs focus:ring-1 focus:ring-mustard-500 focus:outline-none dark:text-white font-mono"
                        placeholder="282001"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">City/District</label>
                      <input 
                        type="text" name="city" required value={formData.city} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs focus:ring-1 focus:ring-mustard-500 focus:outline-none dark:text-white"
                        placeholder="Agra"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">State</label>
                    <input 
                      type="text" name="state" required value={formData.state} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs focus:ring-1 focus:ring-mustard-500 focus:outline-none dark:text-white"
                      placeholder="Uttar Pradesh"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Local Address</label>
                    <textarea 
                      name="address" rows="3" required value={formData.address} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs focus:ring-1 focus:ring-mustard-500 focus:outline-none dark:text-white"
                      placeholder="House No., Street Name, Near Landmark, Jarar"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Continue button */}
              <button
                type="button" onClick={nextStep}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-mustard-500 dark:hover:bg-mustard-600 text-white dark:text-slate-900 font-black rounded-2xl transition shadow-xl flex items-center justify-center gap-2 text-sm active:scale-95 shadow-mustard-500/10"
              >
                Delivery Summary <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: SUMMARY SYNOPSIS */}
          {activeStep === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Product Review card */}
              <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 dark:border-white/5">Items Review</h3>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-3 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={item.image} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{item.name}</h4>
                          <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">₹{((item.wholesalePrice || item.retailPrice) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Node Address summary */}
              <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipping Node</h3>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{formData.name}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{formData.address}, {formData.city}, {formData.state} - {formData.pincode}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-2">Ph: {formData.phone}</p>
              </div>

              {/* Total Card */}
              <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-2.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Node Fee</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white border-t border-slate-100 dark:border-white/5 pt-3">
                  <span>Total Amount Due</span>
                  <span className="text-base font-black text-mustard-500">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Sticky continue */}
              <button
                type="button" onClick={nextStep}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-mustard-500 dark:hover:bg-mustard-600 text-white dark:text-slate-900 font-black rounded-2xl transition shadow-xl flex items-center justify-center gap-2 text-sm active:scale-95 shadow-mustard-500/10"
              >
                Select Payment Mode <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 3: PAYMENT */}
          {activeStep === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Payment selector */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Payment Mode</p>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* COD */}
                  <div 
                    onClick={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                      formData.paymentMethod === 'cod' 
                        ? 'border-mustard-500 bg-mustard-500/5' 
                        : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#120d0a]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <Banknote className="w-5 h-5 text-mustard-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">Cash on Delivery (COD)</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Pay at your doorstep from Agra factory delivery node.</p>
                    </div>
                  </div>

                  {/* Razorpay Online */}
                  <div 
                    onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                      formData.paymentMethod === 'online' 
                        ? 'border-mustard-500 bg-mustard-500/5' 
                        : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#120d0a]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <CreditCard className="w-5 h-5 text-mustard-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">Secured Cards & Netbanking</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Securely hosted checkout powered by Razorpay.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total review */}
              <div className="glass-card bg-white dark:bg-[#120d0a] border border-slate-100 dark:border-white/5 rounded-3xl p-5 shadow-sm flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                <span>Total Amount Payable</span>
                <span className="text-lg font-black text-mustard-500">₹{grandTotal.toLocaleString()}</span>
              </div>

              {/* Secure verification notice */}
              <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Cryptographic secure channel. Instant transaction confirmation.
              </div>

              {/* Sticky confirm */}
              <button
                type="button" 
                onClick={() => !isProcessing && handleSubmit()}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-mustard-500 dark:hover:bg-mustard-600 text-white dark:text-slate-900 font-black rounded-2xl transition shadow-xl flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-50 shadow-mustard-500/10"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing Order...</>
                ) : (
                  formData.paymentMethod === 'cod' ? 'Confirm Delivery Order' : 'Authorize Secure Payment'
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // DESKTOP PAGE RENDER
  // ----------------------------------------------------
  const renderDesktopCheckout = () => (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark selection:bg-mustard-500 selection:text-white relative">
      <div className="container mx-auto px-6 lg:px-12">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-8">Secure Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column - Forms */}
          <form onSubmit={handleSubmit} className="flex-1 space-y-8">
            <div className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <MapPin className="text-mustard-500 w-6 h-6" /> Delivery Address
                </h2>
                
                <button
                  type="button"
                  onClick={fetchGPSLocation}
                  disabled={isFetchingLocation || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white dark:text-slate-200 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 interactive animate-fade-in"
                >
                  <Navigation className={`w-4 h-4 ${isFetchingLocation ? 'animate-pulse text-mustard-400' : ''}`} /> 
                  {isFetchingLocation ? 'Locating...' : 'Use GPS Location'}
                </button>
              </div>

              {/* Saved Addresses Section */}
              {savedAddresses.length > 0 && (
                <div className="mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-4">
                    Saved Addresses (Select to auto-fill)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => (
                      <div 
                        key={addr.id}
                        onClick={() => !isProcessing && handleSelectSavedAddress(addr)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          selectedAddressId === addr.id 
                            ? 'border-mustard-500 bg-mustard-50/50 dark:bg-mustard-900/10 shadow-sm' 
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-black/10'
                        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-slate-900 dark:text-white capitalize">{addr.name}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{addr.address}, {addr.city}</p>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">Phone: {addr.phone}</p>
                      </div>
                    ))}
                    
                    <div 
                      onClick={() => !isProcessing && handleSelectNewAddressOption()}
                      className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                        selectedAddressId === 'new' 
                          ? 'border-mustard-500 bg-mustard-50/50 dark:bg-mustard-900/10 text-mustard-600' 
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-400'
                      } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      <MapPin className="w-8 h-8 mb-2" />
                      <span className="text-sm font-bold">Add New Address</span>
                    </div>
                  </div>
                </div>
              )}

              {pincodeMessage && (
                <div className="mb-6 bg-mustard-500/10 border border-mustard-500/20 text-mustard-600 dark:text-mustard-400 text-xs py-2 px-4 rounded-xl font-bold text-center">
                  {pincodeMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recipient Name</label>
                  <input 
                    type="text" name="name" required value={formData.name} onChange={handleChange} disabled={isProcessing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 focus:outline-none text-slate-900 dark:text-white"
                    placeholder="Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobile Phone</label>
                  <input 
                    type="tel" name="phone" required value={formData.phone} onChange={handleChange} disabled={isProcessing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 focus:outline-none text-slate-900 dark:text-white font-mono"
                    placeholder="9999999999"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pincode</label>
                    <input 
                      type="text" name="pincode" maxLength="6" required value={formData.pincode} onChange={handleChange} disabled={isProcessing}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 focus:outline-none text-slate-900 dark:text-white font-mono"
                      placeholder="282001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City</label>
                    <input 
                      type="text" name="city" required value={formData.city} onChange={handleChange} disabled={isProcessing}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 focus:outline-none text-slate-900 dark:text-white"
                      placeholder="Agra"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">State</label>
                  <input 
                    type="text" name="state" required value={formData.state} onChange={handleChange} disabled={isProcessing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 focus:outline-none text-slate-900 dark:text-white"
                    placeholder="Uttar Pradesh"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address Lines</label>
                  <textarea 
                    name="address" rows="3" required value={formData.address} onChange={handleChange} disabled={isProcessing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 focus:outline-none text-slate-900 dark:text-white"
                    placeholder="House No., Building Name, Area Colony, Street Address"
                  />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Select Payment Mode</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  formData.paymentMethod === 'cod' ? 'border-mustard-500 bg-mustard-50/30 dark:bg-mustard-900/10' : 'border-slate-200 dark:border-white/5 hover:border-slate-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} disabled={isProcessing}
                      className="text-mustard-500 focus:ring-mustard-500 w-4 h-4 border-slate-300"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">Cash on Delivery (COD)</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Pay in cash or UPI at delivery doorstep.</span>
                    </div>
                  </div>
                </label>

                <label className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  formData.paymentMethod === 'online' ? 'border-mustard-500 bg-mustard-50/30 dark:bg-mustard-900/10' : 'border-slate-200 dark:border-white/5 hover:border-slate-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" name="paymentMethod" value="online" checked={formData.paymentMethod === 'online'} onChange={handleChange} disabled={isProcessing}
                      className="text-mustard-500 focus:ring-mustard-500 w-4 h-4 border-slate-300"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">Secured Online (Razorpay)</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">UPI, Cards, and Netbanking enabled.</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </form>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-96">
            <div className="glass-card bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm sticky top-32">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-white/10 pb-4">Order Summary</h2>
              
              <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-60 overflow-y-auto mb-6 pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={item.image} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate uppercase">{item.name}</p>
                        <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">₹{((item.wholesalePrice || item.retailPrice) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Price synopsis */}
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-white/10 pt-4 mb-6">
                <div className="flex justify-between">
                  <span>Basket Subtotal</span>
                  <span className="font-bold text-slate-950 dark:text-white">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agra Node Shipping</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    {deliveryFee === 0 ? <span className="text-green-600 font-bold uppercase text-xs">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-base font-bold text-slate-950 dark:text-white border-t border-slate-100 dark:border-white/10 pt-4">
                  <span>Grand Total</span>
                  <span className="text-xl font-black text-mustard-600 dark:text-mustard-400">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Security Seal */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-6 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5">
                <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span>PCI-DSS Cryptographically secured connection. Instant dispatch verification.</span>
              </div>

              <button
                type="submit" form="checkoutForm" onClick={(e) => { e.preventDefault(); handleSubmit(); }}
                disabled={isProcessing}
                className="w-full py-4 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 interactive text-sm disabled:opacity-50"
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing Order...</>
                ) : (
                  formData.paymentMethod === 'cod' ? 'Confirm Dispatch Order' : 'Proceed to Payment Gate'
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return isMobile ? renderMobileCheckout() : renderDesktopCheckout();
};

export default Checkout;
