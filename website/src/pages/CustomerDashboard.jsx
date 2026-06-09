import { API_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Package, MapPin, Gift, Clock, Search, CheckCircle, XCircle, ChevronRight, Star, RefreshCw, Receipt } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.token) return;
      try {
        const res = await fetch(`${API_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const formattedOrders = data.map(o => ({
            id: o.id,
            date: o.created_at ? o.created_at.replace(' ', 'T') + 'Z' : new Date().toISOString(),
            user: { name: o.userName || user.name, email: o.userEmail },
            address: o.address_data,
            items: JSON.parse(o.items_data),
            total: o.total_amount,
            status: o.status,
          }));
          setOrders(formattedOrders);
        }
      } catch (e) {
        console.error("Failed to fetch orders.", e);
      }
    };
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return order.id.toLowerCase().includes(query) || 
           order.status.toLowerCase().includes(query) || 
           order.items.some(item => item.name.toLowerCase().includes(query));
  });

  const renderOrders = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order History</h2>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-20 text-mustard-500" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No orders found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:border-mustard-500/50 transition-colors">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white font-mono">{order.id}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.date).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">₹{order.total.toLocaleString()}</span>
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                    (order.status === 'Accepted' || order.status === 'Verified') ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                    order.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                    'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  }`}>
                    {order.status}
                  </span>
                  <Link 
                    to="/order-success"
                    state={{ orderId: order.id, fromDashboard: true }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-white/5"
                  >
                    <Receipt className="w-3.5 h-3.5 text-mustard-500" /> Invoice
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {order.items.map((item, idx) => (
                  <Link to={`/product/${item.id}`} key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-black/40 p-2 rounded-xl border border-slate-100 dark:border-white/5 group hover:border-mustard-500 transition-colors">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col pr-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-mustard-500 transition-colors">{item.name}</span>
                      <span className="text-[10px] text-slate-500">Qty: {item.quantity}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderAddresses = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Saved Addresses</h2>
        <button className="px-4 py-2 bg-mustard-500 hover:bg-mustard-600 text-black text-sm font-bold rounded-xl transition-colors">Add New</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card bg-white dark:bg-black/30 border-2 border-mustard-500 rounded-3xl p-6 shadow-sm relative">
          <div className="absolute top-4 right-4 bg-mustard-500 text-black text-[10px] font-bold px-2 py-1 rounded-md uppercase">Default</div>
          <div className="w-10 h-10 bg-mustard-50 dark:bg-mustard-500/10 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5 text-mustard-600 dark:text-mustard-400" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Home Address</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            123 Main Street, Apartment 4B<br/>
            New Delhi, Delhi 110001<br/>
            India
          </p>
          <div className="flex gap-2">
            <button className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-mustard-500 transition-colors">Edit</button>
            <button className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-4">Delete</button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderLoyalty = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card bg-gradient-to-br from-mustard-500 to-amber-600 rounded-3xl p-8 shadow-xl text-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-1 opacity-80">Available Balance</p>
            <h2 className="text-5xl font-black mb-2 flex items-center gap-2">
              <Star className="w-10 h-10 fill-current" /> 1,250
            </h2>
            <p className="font-medium opacity-90">You're 250 points away from Gold Tier!</p>
          </div>
          <button className="px-6 py-3 bg-black text-mustard-500 font-bold rounded-2xl hover:bg-black/80 transition-colors shadow-lg">
            Redeem Points
          </button>
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-8 mb-4">Recent Activity</h3>
      <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Order Reward</p>
            <p className="text-xs text-slate-500">2 days ago</p>
          </div>
          <span className="font-bold text-green-500">+50 Points</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Account Creation</p>
            <p className="text-xs text-slate-500">1 week ago</p>
          </div>
          <span className="font-bold text-green-500">+1000 Points</span>
        </div>
      </div>
    </motion.div>
  );

  const renderSubscriptions = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Subscriptions</h2>
        <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl transition-colors">Browse Plans</button>
      </div>
      <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-mustard-50 dark:bg-mustard-500/10 rounded-2xl flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-mustard-600 dark:text-mustard-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Monthly Gold Plan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">15L Kacchi Ghani Mustard Oil delivered every month.</p>
            <p className="text-xs font-semibold text-green-500 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active (Next delivery in 5 days)</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          <span className="font-bold text-xl text-slate-900 dark:text-white">₹2,850 <span className="text-sm text-slate-500 font-normal">/mo</span></span>
          <button className="text-sm font-bold text-mustard-600 dark:text-mustard-400 hover:text-mustard-700 transition-colors">Manage</button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-[#0a0500] selection:bg-mustard-500/30">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-mustard-600 to-amber-500 capitalize">{user.name}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your orders, addresses, and loyalty rewards.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="glass-card bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'orders', icon: Package, label: 'Orders' },
                { id: 'addresses', icon: MapPin, label: 'Addresses' },
                { id: 'loyalty', icon: Gift, label: 'Loyalty Points' },
                { id: 'subscriptions', icon: RefreshCw, label: 'Subscriptions' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-mustard-500 text-black shadow-lg shadow-mustard-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'orders' && <motion.div key="orders">{renderOrders()}</motion.div>}
              {activeTab === 'addresses' && <motion.div key="addresses">{renderAddresses()}</motion.div>}
              {activeTab === 'loyalty' && <motion.div key="loyalty">{renderLoyalty()}</motion.div>}
              {activeTab === 'subscriptions' && <motion.div key="subscriptions">{renderSubscriptions()}</motion.div>}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-10 right-10 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border ${
              toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400' : 'bg-green-500/90 text-white border-green-400'
            }`}
          >
            {toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span className="font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDashboard;
