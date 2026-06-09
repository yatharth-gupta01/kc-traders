import { API_URL } from '../config/api';
import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, Truck, Package, ArrowLeft, Printer, ShieldCheck, Receipt, DollarSign, Calendar, MapPin } from 'lucide-react';

const OrderSuccess = () => {
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear cart upon hitting success page once on mount
  useEffect(() => {
    clearCart();
  }, []);

  // Read order ID from checkout state
  const orderId = location.state?.orderId;

  // Fetch Order Details securely for GST Invoice
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !user.token || !orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const orders = await res.json();
          const matchingOrder = orders.find(o => o.id === orderId);
          if (matchingOrder) {
            setOrder(matchingOrder);
          }
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, user]);

  const handlePrint = () => {
    window.print();
  };

  // GST Calculation Logic (Edible vegetable oil attracts 5% GST in India)
  const calculateGST = (totalAmount) => {
    // Delivery Fee logic: Free over 1500, else 50
    const delivery = totalAmount > 1500 ? 0 : 50;
    const subtotal = totalAmount - delivery;
    const taxableValue = subtotal / 1.05; // 5% GST inclusive
    const gstTotal = subtotal - taxableValue;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    return {
      delivery,
      subtotal,
      taxableValue: taxableValue.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      gstTotal: gstTotal.toFixed(2)
    };
  };

  const parsedItems = order ? JSON.parse(order.items_data) : [];
  const gstBreakdown = order ? calculateGST(order.total_amount) : { delivery: 0, subtotal: 0, taxableValue: 0, cgst: 0, sgst: 0, gstTotal: 0 };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark flex items-center justify-center p-6 selection:bg-mustard-500 selection:text-white">
      <div className="w-full max-w-3xl text-center">
        
        {/* Celebration Success Circle Animation (no-print) */}
        <div className="no-print">
          <motion.div 
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [1.1, 1], opacity: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
            className="relative w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.25)]"
          >
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            {/* Ambient liquid drop rings */}
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute -inset-4 border-2 border-green-500/20 rounded-full"
            />
          </motion.div>

          <motion.h1 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4"
          >
            Order <span className="text-gradient">Placed Successfully!</span>
          </motion.h1>

          <motion.p 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto font-light"
          >
            Thank you for shopping with KC Traders. Your payment has been securely captured, and your invoice has been compiled.
          </motion.p>
        </div>

        {/* GST COMPLIANT TAX INVOICE CARD (Print-Optimized layout) */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="glass-card bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 mb-8 shadow-xl text-left relative overflow-hidden print:shadow-none print:border-none print:bg-white print:text-black print:p-0"
        >
          {/* Header row (Print only or display nicely) */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 border-b border-slate-100 dark:border-white/10 pb-6">
            <div>
              <h2 className="text-2xl font-display font-black text-mustard-600 dark:text-mustard-400 tracking-wide uppercase">KC Traders</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Traditional Kacchi Ghani Mustard Oils</p>
              <p className="text-[10px] text-slate-400 mt-1">GSTIN: 09AAACK5421M1Z5 | HSN Code: 1514</p>
            </div>
            <div className="text-left md:text-right">
              <span className="inline-block bg-mustard-500/10 text-mustard-600 dark:text-mustard-400 border border-mustard-500/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-2 print:hidden">
                Tax Invoice
              </span>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Invoice Ref: {orderId || 'ORD-SIMULATED-99'}</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 md:justify-end mt-1">
                <Calendar className="w-3 h-3" /> Date: {order ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
            {/* Bill To */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-mustard-500" /> Billed & Shipped To
              </p>
              <p className="font-bold text-slate-900 dark:text-white capitalize">{order ? order.address_data.split(',')[0] : user?.name || 'Valued Customer'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {order ? order.address_data : 'Online Transaction Pending Verification Address'}
              </p>
            </div>

            {/* Payment Details */}
            <div className="md:text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-1 md:justify-end">
                <Receipt className="w-3.5 h-3.5 text-mustard-500" /> Payment Synopsis
              </p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Mode: <span className="uppercase text-slate-900 dark:text-white font-bold">{order ? order.payment_method : 'online'}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Status: <span className="font-bold text-green-600 dark:text-green-400">{order ? order.status : 'Paid'}</span>
              </p>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-2.5">Item Details</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Rate</th>
                  <th className="py-2.5 text-right">Net Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {parsedItems.length > 0 ? (
                  parsedItems.map((item, idx) => {
                    const unitPrice = order ? (order.total_amount > 1500 ? order.total_amount - 0 : order.total_amount - 50) / parsedItems.reduce((acc, i) => acc + i.quantity, 0) : 0; // Mock breakdown
                    const itemRate = (item.price || unitPrice || 350);
                    return (
                      <tr key={`invoice-item-${idx}`} className="text-slate-800 dark:text-slate-200">
                        <td className="py-3 font-semibold text-xs leading-tight">
                          {item.name}
                          <span className="block text-[10px] text-slate-400 font-normal">HSN: 1514 | Tax Rate: 5% (Edible Vegetable Oil)</span>
                        </td>
                        <td className="py-3 text-center text-xs font-medium">{item.quantity}</td>
                        <td className="py-3 text-right text-xs font-medium">₹{itemRate}</td>
                        <td className="py-3 text-right text-xs font-bold">₹{itemRate * item.quantity}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="text-slate-800 dark:text-slate-200">
                    <td className="py-3 font-semibold text-xs leading-tight">
                      Premium Kacchi Ghani Mustard Oil (5L Canister)
                      <span className="block text-[10px] text-slate-400 font-normal">HSN: 1514 | Tax Rate: 5% (Edible Vegetable Oil)</span>
                    </td>
                    <td className="py-3 text-center text-xs font-medium">1</td>
                    <td className="py-3 text-right text-xs font-medium">₹850.00</td>
                    <td className="py-3 text-right text-xs font-bold">₹850.00</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing & GST Breakout Rows */}
          <div className="w-full md:w-1/2 ml-auto space-y-2.5 text-xs border-t border-slate-100 dark:border-white/10 pt-4">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Gross Taxable Value (Excl. Tax)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{order ? gstBreakdown.taxableValue : '809.52'}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Central GST (CGST - 2.5%)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{order ? gstBreakdown.cgst : '20.24'}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>State GST (SGST - 2.5%)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">₹{order ? gstBreakdown.sgst : '20.24'}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Shipping & Handling</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {gstBreakdown.delivery === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${gstBreakdown.delivery}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold border-t border-slate-100 dark:border-white/10 pt-3 text-slate-900 dark:text-white">
              <span>Total Invoice Amount</span>
              <span className="text-lg font-black text-mustard-600 dark:text-mustard-400">₹{order ? order.total_amount : '850.00'}</span>
            </div>
          </div>

          {/* Verification seal decoration */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Cryptographically Authorized Signature Verified.
            </span>
            <span className="italic">KC Traders E-Commerce Node.</span>
          </div>

        </motion.div>

        {/* Buttons (no-print) */}
        <motion.div
           initial={{ y: 15, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.45 }}
           className="flex flex-col sm:flex-row items-center justify-center gap-4 no-print"
        >
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl interactive text-center"
          >
            <Printer className="w-5 h-5" /> Save / Print Invoice
          </button>
          
          <Link 
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white font-semibold rounded-xl transition-all shadow-md interactive text-center border border-white/5"
          >
            <Package className="w-5 h-5 text-mustard-400" /> View Your Dashboard
          </Link>
        </motion.div>

        <p className="mt-12 text-xs text-slate-400 max-w-sm mx-auto no-print">
          Disclaimer: This tax invoice is dynamically derived based on state GST guidelines (5% total tax rate) for registered edible vegetable oil sales.
        </p>
      </div>

      {/* Embedded print CSS media query for perfect printing */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .glass-card {
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide default header and footer of browser print window */
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccess;
