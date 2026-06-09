import { API_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Package, Truck, FileText, Search, CheckCircle, XCircle, ShoppingCart, Percent, Download } from 'lucide-react';

const ShopkeeperDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bulk');
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
        console.error("Failed to fetch orders.");
      }
    };
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return order.id.toLowerCase().includes(query) || order.status.toLowerCase().includes(query);
  });

  const handleDownloadInvoice = (invoiceId) => {
    triggerToast(`Generating invoice ${invoiceId}...`, 'success');
    setTimeout(() => {
      const invoiceData = `
KC Traders - GST Invoice
------------------------
Invoice No: ${invoiceId}
Date: May 1, 2026
------------------------
Items:
1. Kacchi Ghani Mustard Oil (15L Tin) - 10 Units - ₹26,500
2. Premium Filtered Mustard Oil (1L x 12) - 10 Units - ₹18,700
------------------------
Subtotal: ₹45,200
GST (5%): ₹2,260
Total Amount: ₹47,460
------------------------
Thank you for your business!
      `;
      const blob = new Blob([invoiceData.trim()], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      triggerToast('Invoice downloaded successfully!', 'success');
    }, 800);
  };

  const renderBulkOrdering = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest mb-1 text-blue-200">Wholesale Partner Pricing</p>
            <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
              <Percent className="w-8 h-8" /> Up to 25% Off Retail
            </h2>
            <p className="text-blue-100/80">Minimum order quantity: 50 Liters.</p>
          </div>
          <Link to="/shop" className="px-6 py-3 bg-white text-blue-900 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5"/> Shop Catalog
          </Link>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Quick Bulk Reorder</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'Kacchi Ghani Mustard Oil (15L Tin)', price: '₹2,650/tin', min: 10 },
          { name: 'Premium Filtered Mustard Oil (1L x 12)', price: '₹2,100/box', min: 20 },
        ].map((item, idx) => (
          <div key={idx} className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">{item.name}</h4>
              <p className="text-blue-600 dark:text-blue-400 font-bold text-xl mt-2">{item.price}</p>
              <p className="text-xs text-slate-500 mt-1">Min. Qty: {item.min}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <input type="number" min={item.min} defaultValue={item.min} className="w-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-center font-bold" />
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition-colors">Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderOrders = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Wholesale Order History</h2>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-20 text-blue-500" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">No wholesale orders found.</p>
        </div>
      ) : (
        <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-5 px-6">Order ID & Date</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6">Items</th>
                <th className="py-5 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900 dark:text-white font-mono">{order.id}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(order.date).toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                      (order.status === 'Accepted' || order.status === 'Verified') ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                      order.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                      'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{order.items.length} Product(s)</span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white text-lg">
                    ₹{order.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  const renderInvoices = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">GST Invoices</h2>
      </div>
      <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">INV-2026-0501</p>
              <p className="text-xs text-slate-500">May 1, 2026 • ₹45,200</p>
            </div>
          </div>
          <button 
            onClick={() => handleDownloadInvoice('INV-2026-0501')}
            className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm transition-all group-hover:scale-105"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-[#050a10] selection:bg-blue-500/30">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Partner Portal, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 capitalize">{user.name}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Manage bulk orders, view specialized pricing, and download tax invoices.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="glass-card bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl p-4 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'bulk', icon: Package, label: 'Bulk Ordering' },
                { id: 'orders', icon: Truck, label: 'Order History' },
                { id: 'invoices', icon: FileText, label: 'GST Invoices' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
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
              {activeTab === 'bulk' && <motion.div key="bulk">{renderBulkOrdering()}</motion.div>}
              {activeTab === 'orders' && <motion.div key="orders">{renderOrders()}</motion.div>}
              {activeTab === 'invoices' && <motion.div key="invoices">{renderInvoices()}</motion.div>}
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

export default ShopkeeperDashboard;
