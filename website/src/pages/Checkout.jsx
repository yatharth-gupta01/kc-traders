import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Truck, CreditCard, ChevronRight, CheckCircle2, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';

const Checkout = () => {
  const { cartItems, getCartTotal, getPriceForUser } = useCart();
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

  // Razorpay Sandbox Simulator State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedOrder, setSimulatedOrder] = useState(null);
  const [selectedSimulatedMethod, setSelectedSimulatedMethod] = useState('gpay');
  const [simulatorStep, setSimulatorStep] = useState('select'); 
  const [upiPin, setUpiPin] = useState('');
  const [processingText, setProcessingText] = useState('Connecting to payment portal...');

  // Dynamic Razorpay Script Loading
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // Clean up script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Handle Simulated Processing flow
  useEffect(() => {
    if (simulatorStep !== 'processing') return;

    const texts = [
      "Connecting to UPI secure gateway...",
      "Requesting authorization from bank...",
      "Awaiting user UPI PIN approval...",
      "Authenticating digital signature...",
      "Capturing verified payment order..."
    ];

    let currentIdx = 0;
    setProcessingText(texts[0]);
    
    const interval = setInterval(() => {
      if (currentIdx < texts.length - 1) {
        currentIdx++;
        setProcessingText(texts[currentIdx]);
      }
    }, 700);

    const timer = setTimeout(() => {
      clearInterval(interval);
      handleSimulatedPaymentSuccess();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [simulatorStep]);

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

  // Secure checkout handler
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

    setIsProcessing(true);

    // Cash on Delivery Integration
    if (formData.paymentMethod === 'cod') {
      const orderId = `ORD-KCT-${Math.floor(Math.random() * 90000) + 10000}`;
      const orderPayload = {
        id: orderId,
        address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode} (Ph: ${formData.phone})`,
        items: cartItems,
        total: grandTotal,
        paymentMethod: 'cod'
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
          // Save address to book in background
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
          } catch (e) {}

          navigate('/order-success', { state: { orderId, paymentMethod: 'cod' } });
        } else {
          if (res.status === 401 || res.status === 403) {
            alert("Your login session has expired for security. Please log in again to complete your order.");
            logout();
            navigate('/login');
            setIsProcessing(false);
            return;
          }
          alert("Server rejected your order. Please login securely again.");
        }
      } catch (error) {
        alert("Failed to securely reach the database server.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Online Payments Integration (Razorpay Checkout)
    try {
      const res = await fetch('http://localhost:5000/api/payments/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ amount: grandTotal })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert("Your login session has expired for security. Please log in again to complete your order.");
          logout();
          navigate('/login');
          setIsProcessing(false);
          return;
        }
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText || res.statusText}`);
      }

      const orderData = await res.json();
      const { id, amount, currency, key, isSimulation } = orderData;

      if (isSimulation) {
        // Razorpay Simulation Sandbox Mode
        setSimulatedOrder({ id, amount, currency, key });
        setSimulatorStep('select');
        setUpiPin('');
        setShowSimulator(true);
        setIsProcessing(false);
      } else {
        // Live Razorpay Checkout Integration
        if (!window.Razorpay) {
          alert("Razorpay checkout SDK failed to load. Please check your network.");
          setIsProcessing(false);
          return;
        }

        const options = {
          key: key,
          amount: amount,
          currency: currency,
          name: "KC Traders",
          description: "Premium Edible Oils",
          image: "https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&w=128&q=80",
          order_id: id,
          handler: async function (response) {
            setIsProcessing(true);
            try {
              const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode} (Ph: ${formData.phone})`,
                  items: cartItems,
                  total: grandTotal,
                  isSimulation: false
                })
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                navigate('/order-success', { state: { orderId: verifyData.orderId, paymentMethod: 'online' } });
              } else {
                if (verifyRes.status === 401 || verifyRes.status === 403) {
                  alert("Your login session has expired for security. Please log in again to complete your order.");
                  logout();
                  navigate('/login');
                  setIsProcessing(false);
                  return;
                }
                alert("Cryptographic signature verification failed. Payment was rejected.");
              }
            } catch (err) {
              alert("Error verifying payment signature on server.");
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: formData.name,
            contact: formData.phone,
            email: user?.email || "customer@example.com"
          },
          theme: {
            color: "#eab308"
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay via UPI",
                  instruments: [
                    {
                      method: "upi"
                    }
                  ]
                }
              },
              sequence: ["block.upi"],
              preferences: {
                show_default_blocks: true
              }
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsProcessing(false);
      }

    } catch (err) {
      console.error("Checkout transaction initialization failed:", err);
      alert(`Failed to initialize transaction: ${err.message}`);
      setIsProcessing(false);
    }
  };

  // Handle keypad presses on simulated UPI PIN screen
  const handleKeypadPress = (val) => {
    if (val === 'del') {
      setUpiPin(prev => prev.slice(0, -1));
    } else if (val === 'ok') {
      if (upiPin.length === 6) {
        setSimulatorStep('processing');
      } else {
        alert("Please enter a 6-digit simulated UPI PIN.");
      }
    } else {
      if (upiPin.length < 6) {
        const newPin = upiPin + val;
        setUpiPin(newPin);
      }
    }
  };

  // Simulated Payment Success Handler
  const handleSimulatedPaymentSuccess = async () => {
    if (!simulatedOrder) return;
    setShowSimulator(false);
    setIsProcessing(true);

    try {
      const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          razorpay_order_id: simulatedOrder.id,
          razorpay_payment_id: `pay_sim_${Math.floor(Math.random() * 9000000) + 1000000}`,
          razorpay_signature: 'simulated_signature_xyz_12345',
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode} (Ph: ${formData.phone})`,
          items: cartItems,
          total: grandTotal,
          isSimulation: true
        })
      });

      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        navigate('/order-success', { state: { orderId: verifyData.orderId, paymentMethod: 'online' } });
      } else {
        if (verifyRes.status === 401 || verifyRes.status === 403) {
          alert("Your login session has expired for security. Please log in again to complete your order.");
          logout();
          navigate('/login');
          setIsProcessing(false);
          return;
        }
        alert("Payment simulator verification rejected by server.");
      }
    } catch (err) {
      alert("Error linking simulated payment to database.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark selection:bg-mustard-500 selection:text-white relative">
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
                  disabled={isFetchingLocation || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white dark:text-slate-200 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 interactive animate-fade-in"
                >
                  <Navigation className={`w-4 h-4 ${isFetchingLocation ? 'animate-pulse text-mustard-400' : ''}`} /> 
                  {isFetchingLocation ? 'Locating...' : 'Use GPS Location'}
                </button>
              </div>

              {/* Saved Addresses Section (Flipkart-Style) */}
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

                    <div 
                      onClick={() => !isProcessing && handleSelectNewAddressOption()}
                      className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center ${
                        selectedAddressId === 'new' 
                          ? 'border-mustard-500 bg-mustard-50/50 dark:bg-mustard-900/10 shadow-sm' 
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-black/10'
                      } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      <div className="text-center">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mx-auto mb-2 ${
                          selectedAddressId === 'new' ? 'border-mustard-500 bg-mustard-500' : 'border-slate-300 dark:border-white/20'
                        }`}>
                          {selectedAddressId === 'new' && <span className="w-1.5 h-1.5 bg-white dark:bg-slate-900 rounded-full" />}
                        </span>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Use a New Address</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input type="text" name="name" required disabled={isProcessing} value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white disabled:opacity-50" placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobile Number</label>
                  <input type="tel" name="phone" required disabled={isProcessing} value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white disabled:opacity-50" placeholder="9876543210" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pincode</label>
                <input 
                  type="text" 
                  name="pincode" 
                  required 
                  maxLength={6}
                  disabled={isProcessing}
                  value={formData.pincode} 
                  onChange={handleChange} 
                  className="w-full md:w-1/2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white disabled:opacity-50" 
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
                  <input type="text" name="state" required readonly value={formData.state} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#1a120c] border border-slate-200 dark:border-white/10 font-medium text-slate-600 dark:text-slate-400 cursor-not-allowed" placeholder="Auto-filled via Pincode" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City/District</label>
                  <input type="text" name="city" required readonly value={formData.city} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-[#1a120c] border border-slate-200 dark:border-white/10 font-medium text-slate-600 dark:text-slate-400 cursor-not-allowed" placeholder="Auto-filled via Pincode" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Delivery Address (House No, Building, Street, Area)</label>
                <textarea 
                  name="address" 
                  required 
                  rows="3"
                  disabled={isProcessing}
                  value={formData.address} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-earth-dark border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white resize-none disabled:opacity-50" 
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
                  <div 
                    onClick={() => !isProcessing && setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                    className={`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-mustard-500 bg-mustard-50 dark:bg-mustard-900/20 shadow-sm' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'} ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <input type="radio" name="paymentMethod" value="cod" disabled={isProcessing} checked={formData.paymentMethod === 'cod'} readOnly className="sr-only" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">Cash on Delivery <CheckCircle2 className={`w-4 h-4 ${formData.paymentMethod === 'cod' ? 'text-mustard-500' : 'opacity-0'}`} /></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pay with cash upon package arrival.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => !isProcessing && setFormData(prev => ({ ...prev, paymentMethod: 'online' }))}
                    className={`relative flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === 'online' ? 'border-mustard-500 bg-mustard-50 dark:bg-mustard-900/20 shadow-sm' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'} ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <input type="radio" name="paymentMethod" value="online" disabled={isProcessing} checked={formData.paymentMethod === 'online'} readOnly className="sr-only" />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">Pay Online (Razorpay) <CheckCircle2 className={`w-4 h-4 ${formData.paymentMethod === 'online' ? 'text-mustard-500' : 'opacity-0'}`} /></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">UPI (GPay/PhonePe), Credit Cards, Netbanking.</p>
                    </div>
                  </div>
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

               <button 
                 type="submit" 
                 form="checkoutForm"
                 disabled={isProcessing}
                 className="w-full py-4 bg-mustard-500 hover:bg-mustard-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-slate-900 disabled:text-slate-500 font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 interactive"
               >
                 {isProcessing ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     Securing checkout...
                   </>
                 ) : (
                   <>
                     Place Order <ChevronRight className="w-5 h-5" />
                   </>
                 )}
               </button>
               <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                 <ShieldCheck className="w-3 h-3 text-mustard-500" /> Secure Highly Encrypted Gateway.
               </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* RAZORPAY PREMIUM SANDBOX SIMULATOR MODAL */}
      <AnimatePresence>
        {showSimulator && simulatedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glass-card bg-slate-950/95 border border-white/10 rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative text-white selection:bg-mustard-500 selection:text-slate-950"
            >
              
              {/* STEP 1: CHOOSE simulated payment option */}
              {simulatorStep === 'select' && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-mustard-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        Razorpay
                      </div>
                      <span className="text-xs font-semibold text-slate-400 tracking-wider">Secure Sandbox Overlay</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowSimulator(false);
                        setIsProcessing(false);
                      }}
                      className="text-slate-400 hover:text-white transition-colors text-sm p-1 rounded-full hover:bg-white/5"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Paying Details */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-6 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <ShieldCheck className="w-16 h-16" />
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Paying To</p>
                    <p className="text-lg font-bold text-white tracking-wide">KC Traders (Kacchi Ghani)</p>
                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-white/5">
                      <span className="text-xs text-slate-300">Total Amount (Inc. GST)</span>
                      <span className="text-3xl font-black text-mustard-400 tracking-wide">₹{(simulatedOrder.amount / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* UPI & Card Options */}
                  <div className="space-y-4 mb-6">
                    <p className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider">Choose Simulated Payment Method</p>
                    
                    {/* UPI options */}
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div 
                        onClick={() => setSelectedSimulatedMethod('gpay')}
                        className={`p-4 border-2 rounded-2xl transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                          selectedSimulatedMethod === 'gpay'
                            ? 'border-mustard-500 bg-mustard-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                            : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full mb-1">
                          <p className={`font-bold text-xs ${selectedSimulatedMethod === 'gpay' ? 'text-mustard-400' : 'text-white'}`}>Google Pay</p>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            selectedSimulatedMethod === 'gpay' ? 'border-mustard-500 bg-mustard-500 text-slate-950' : 'border-slate-500'
                          }`}>
                            {selectedSimulatedMethod === 'gpay' && <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400">UPI checkout</span>
                      </div>

                      <div 
                        onClick={() => setSelectedSimulatedMethod('phonepe')}
                        className={`p-4 border-2 rounded-2xl transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                          selectedSimulatedMethod === 'phonepe'
                            ? 'border-mustard-500 bg-mustard-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                            : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full mb-1">
                          <p className={`font-bold text-xs ${selectedSimulatedMethod === 'phonepe' ? 'text-mustard-400' : 'text-white'}`}>PhonePe</p>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            selectedSimulatedMethod === 'phonepe' ? 'border-mustard-500 bg-mustard-500 text-slate-950' : 'border-slate-500'
                          }`}>
                            {selectedSimulatedMethod === 'phonepe' && <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400">UPI checkout</span>
                      </div>
                    </div>

                    {/* Card Option */}
                    <div 
                      onClick={() => setSelectedSimulatedMethod('card')}
                      className={`p-4 border-2 rounded-2xl flex items-center gap-4 transition-all cursor-pointer relative overflow-hidden text-left ${
                        selectedSimulatedMethod === 'card'
                          ? 'border-mustard-500 bg-mustard-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                          : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className={`p-2 rounded-xl transition-colors ${
                        selectedSimulatedMethod === 'card' ? 'bg-mustard-500/20 text-mustard-400' : 'bg-white/5 text-slate-400'
                      }`}>
                         <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="text-left flex-grow">
                        <p className={`font-semibold text-xs ${selectedSimulatedMethod === 'card' ? 'text-mustard-400' : 'text-white'}`}>Credit / Debit Card</p>
                        <p className="text-[9px] text-slate-400">Visa, Mastercard, RuPay card simulation</p>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        selectedSimulatedMethod === 'card' ? 'border-mustard-500 bg-mustard-500 text-slate-950' : 'border-slate-500'
                      }`}>
                        {selectedSimulatedMethod === 'card' && <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Guarantee */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center mb-6">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Simulated Secure transaction. No real money deducted.</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSimulator(false);
                        setIsProcessing(false);
                      }}
                      className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition-all border border-white/10 interactive"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSimulatedMethod === 'card') {
                          setSimulatorStep('processing');
                        } else {
                          setSimulatorStep('upi-pin');
                        }
                      }}
                      className="flex-1 py-3.5 bg-mustard-500 hover:bg-mustard-600 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-mustard-500/20 interactive"
                    >
                      Authorize Payment
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: UPI PIN INPUT GRID */}
              {simulatorStep === 'upi-pin' && (
                <div className="flex flex-col items-center">
                  
                  {/* Custom Header based on UPI brand */}
                  <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                      {selectedSimulatedMethod === 'gpay' ? 'Google Pay UPI Gateway' : 'PhonePe Secure UPI'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-mustard-400 font-bold uppercase tracking-wider">
                      Sandbox
                    </span>
                  </div>

                  {/* Subtitle Details */}
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Transferring To</p>
                  <p className="text-lg font-bold text-white mb-2">KC Traders Edible Oils</p>
                  <p className="text-3xl font-black text-mustard-400 mb-6">₹{(simulatedOrder.amount / 100).toFixed(2)}</p>

                  <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 mb-6 text-center">
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mb-4">
                      Enter 6-Digit UPI PIN
                    </p>

                    {/* Circular Dot Indicator */}
                    <div className="flex justify-center gap-3 mb-6">
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={`pin-dot-${i}`}
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-100 ${
                            i < upiPin.length 
                              ? 'bg-mustard-500 scale-110 shadow-[0_0_10px_#eab308]' 
                              : 'border border-white/20 bg-white/5'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-400 mb-2">Use the keypad below to enter any simulated numbers</p>
                  </div>

                  {/* Customized tactile numeric keyboard */}
                  <div className="grid grid-cols-3 gap-y-3.5 gap-x-6 w-full max-w-[280px] mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        type="button"
                        key={`keypad-${num}`}
                        onClick={() => handleKeypadPress(num.toString())}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 active:scale-90 transition-all font-bold text-lg text-white flex items-center justify-center mx-auto select-none cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    {/* Del Key */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('del')}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 active:scale-90 transition-all font-bold text-xs text-red-400 flex items-center justify-center mx-auto select-none cursor-pointer"
                    >
                      Delete
                    </button>
                    {/* Zero */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 active:scale-90 transition-all font-bold text-lg text-white flex items-center justify-center mx-auto select-none cursor-pointer"
                    >
                      0
                    </button>
                    {/* Submit checkmark */}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('ok')}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-mustard-500/10 border border-mustard-500/30 hover:bg-mustard-500/20 active:scale-90 transition-all font-extrabold text-xs text-mustard-400 flex items-center justify-center mx-auto select-none cursor-pointer"
                    >
                      OK
                    </button>
                  </div>

                  {/* Cancel PIN Entry */}
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatorStep('select');
                      setUpiPin('');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline transition-colors"
                  >
                    Back to Select Method
                  </button>

                </div>
              )}

              {/* STEP 3: DYNAMIC LOADER */}
              {simulatorStep === 'processing' && (
                <div className="flex flex-col items-center py-10">
                  {/* Glowing bank loader */}
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-mustard-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-white/5 border-b-mustard-400 animate-spin [animation-duration:1.5s]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-10 h-10 text-mustard-400 animate-pulse" />
                    </div>
                  </div>

                  <p className="text-lg font-bold text-white mb-2">Processing Payment</p>
                  <p className="text-xs text-mustard-400 h-6 font-medium animate-pulse text-center">
                    {processingText}
                  </p>

                  <div className="mt-12 text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                    Secure Sandbox Verification active.
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
