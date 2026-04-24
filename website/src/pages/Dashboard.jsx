import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, Clock, Search, LogOut, CheckCircle, XCircle, Database, Edit3, Save } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [editingStock, setEditingStock] = useState(null); // { name, liters }

  // Kick out unauthenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchOrders = async () => {
    if (!user || !user.token) return;
    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const formattedOrders = data.map(o => ({
          id: o.id,
          date: o.created_at,
          user: { name: o.userName || user.name },
          address: o.address_data,
          items: JSON.parse(o.items_data),
          total: o.total_amount,
          status: o.status,
          paymentMethod: o.payment_method
        }));
        setOrders(formattedOrders);
      }
    } catch (e) {
      console.error("Failed to securely pull orders.");
    }
  };

  const fetchStock = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await fetch('http://localhost:5000/api/stock', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStock(data);
      }
    } catch (e) {
      console.error("Failed to fetch stock.");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStock();
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders(); // Refresh table
        alert(`Order marked as ${newStatus}`);
      }
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  const handleUpdateStock = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          product_name: editingStock.product_name, 
          liters: parseFloat(editingStock.available_liters) 
        })
      });
      if (res.ok) {
        setEditingStock(null);
        fetchStock();
        alert("Stock updated!");
      }
    } catch (e) {
      alert("Stock update failed.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark">
      <div className="container mx-auto px-6 lg:px-12">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
              Factory <span className="text-gradient capitalize">Dashboard</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {isAdmin 
                ? "Admin Control - Managing Stock, Verification & Global Orders."
                : "Manage your wholesale/retail orders and track deliveries."}
            </p>
          </div>
          
          <button 
            onClick={handleLogout}
            className="px-6 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold rounded-xl transition-colors hover:bg-red-100 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Action Grid (Only for Admin) */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Stock Management Card */}
            <div className="lg:col-span-2 glass-card bg-white dark:bg-black/30 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-6 h-6 text-mustard-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily Production Stock</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stock.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">{item.product_name}</p>
                    {editingStock?.product_name === item.product_name ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="number"
                          value={editingStock.available_liters}
                          onChange={(e) => setEditingStock({...editingStock, available_liters: e.target.value})}
                          className="w-24 px-3 py-2 rounded-lg bg-white dark:bg-earth-dark border border-mustard-500 text-slate-900 dark:text-white font-bold"
                        />
                        <button onClick={handleUpdateStock} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><Save className="w-4 h-4"/></button>
                        <button onClick={() => setEditingStock(null)} className="p-2 bg-slate-400 text-white rounded-lg"><XCircle className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-mustard-400">{item.available_liters} <span className="text-xs font-medium text-slate-500">Liters</span></h3>
                          <p className="text-[10px] text-slate-400 mt-1">Updated: {new Date(item.last_updated).toLocaleTimeString()}</p>
                        </div>
                        <button onClick={() => setEditingStock(item)} className="p-2 text-slate-400 hover:text-mustard-500"><Edit3 className="w-5 h-5"/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats Widget */}
            <div className="glass-card bg-white dark:bg-black/30 p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Pending Tasks</h2>
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Orders to Verify</p>
                    <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {orders.filter(o => o.status === 'Pending Verification').length}
                    </span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Total Factory Vol.</p>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{stock.reduce((sum, i) => sum + i.available_liters, 0)}L</span>
                 </div>
               </div>
            </div>

          </div>
        )}

        {/* Orders Table */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          {isAdmin ? 'Global Order Log & Verification' : 'Your Order History'}
        </h2>

        {orders.length === 0 ? (
          <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-12 text-center text-slate-500">
             <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No orders recorded.</p>
          </div>
        ) : (
          <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="py-5 px-6">ID / Date</th>
                  <th className="py-5 px-6">Party Info</th>
                  <th className="py-5 px-6">Qty/Items</th>
                  <th className="py-5 px-6">Status</th>
                  {isAdmin && <th className="py-5 px-6">Verification</th>}
                  <th className="py-5 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-white">{order.id}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 uppercase">
                         <Clock className="w-3 h-3" /> {new Date(order.date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{order.user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{order.address}</p>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-mustard-500 bg-mustard-50 dark:bg-mustard-900/20 px-2 py-0.5 rounded-lg border border-mustard-100 dark:border-mustard-800">
                           {order.items.reduce((sum, i) => sum + i.quantity, 0)} Items
                         </span>
                       </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                        order.status === 'Verified' ? 'bg-green-50 text-green-600 border-green-200' :
                        order.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                         {order.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleUpdateStatus(order.id, 'Verified')}
                             className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition shadow-sm"
                             title="Verify Order"
                           >
                             <CheckCircle className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleUpdateStatus(order.id, 'Rejected')}
                             className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-sm"
                             title="Reject Order"
                           >
                             <XCircle className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    )}
                    <td className="py-4 px-6 text-right font-bold text-lg text-slate-900 dark:text-white">
                      ₹{order.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
