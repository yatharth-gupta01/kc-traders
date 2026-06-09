import { API_URL } from '../config/api';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Truck, Clock, Search, LogOut, CheckCircle, XCircle, 
  Database, Edit3, Save, TrendingUp, AlertTriangle, Activity,
  LayoutDashboard, PieChart as PieChartIcon, ArrowRight,
  Users, Mail, Store, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Color Palette for Charts
const COLORS = ['#f59e0b', '#d97706', '#b45309', '#78350f'];

const AdminDashboard = ({ user, logout, orders, stock, fetchOrders, fetchStock, handleUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingStock, setEditingStock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [usersList, setUsersList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const [selectedDayObj, setSelectedDayObj] = useState(new Date());
  const [selectedMonthObj, setSelectedMonthObj] = useState(new Date());
  const [selectedYearObj, setSelectedYearObj] = useState(new Date());

  // Derived Analytics Data
  const { dailyRevenue, monthlyRevenue, yearlyRevenue, todaysOrders, pendingOrders, salesData, productDistribution } = useMemo(() => {
    let daily = 0;
    let monthly = 0;
    let yearly = 0;
    let pending = 0;
    let todaysOrdersCount = 0;
    const salesMap = {}; // date -> revenue
    const productCount = {}; // productName -> count

    const actToday = new Date();
    const actTodayStr = `${actToday.getFullYear()}-${String(actToday.getMonth() + 1).padStart(2, '0')}-${String(actToday.getDate()).padStart(2, '0')}`;

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      const oYear = orderDate.getFullYear();
      const oMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
      const oDay = String(orderDate.getDate()).padStart(2, '0');
      
      const oDayStr = `${oYear}-${oMonth}-${oDay}`;
      const oMonthStr = `${oYear}-${oMonth}`;
      const oYearStr = `${oYear}`;

      if (oDayStr === actTodayStr) {
        todaysOrdersCount += 1;
      }

      // Metrics
      if (order.status !== 'Rejected') {
        const oDayStrSel = `${selectedDayObj.getFullYear()}-${String(selectedDayObj.getMonth() + 1).padStart(2, '0')}-${String(selectedDayObj.getDate()).padStart(2, '0')}`;
        const oMonthStrSel = `${selectedMonthObj.getFullYear()}-${String(selectedMonthObj.getMonth() + 1).padStart(2, '0')}`;
        const oYearStrSel = `${selectedYearObj.getFullYear()}`;

        if (oYearStr === oYearStrSel) yearly += order.total;
        if (oMonthStr === oMonthStrSel) monthly += order.total;
        if (oDayStr === oDayStrSel) daily += order.total;
      }
      
      if (order.status !== 'Accepted' && order.status !== 'Verified' && order.status !== 'Rejected') {
        pending += 1;
      }

      // Time Series Data (last 7 days simulation based on created_at)
      const date = new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (order.status !== 'Rejected') {
        salesMap[date] = (salesMap[date] || 0) + order.total;
      }

      // Product Distribution
      order.items.forEach(item => {
        // Extract base name
        let baseName = "Other";
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes('kacchi')) baseName = 'Kacchi Ghani';
        else if (lowerName.includes('filtered')) baseName = 'Premium Filtered';
        else if (lowerName.includes('yellow')) baseName = 'Yellow Mustard';
        
        productCount[baseName] = (productCount[baseName] || 0) + item.quantity;
      });
    });

    const sData = Object.keys(salesMap).map(date => ({
      name: date,
      revenue: salesMap[date]
    })).slice(-7); // Last 7 unique dates

    const pDist = Object.keys(productCount).map(key => ({
      name: key,
      value: productCount[key]
    }));

    // Fill missing data if empty for UI demo
    if (sData.length === 0) {
      sData.push({ name: 'Mon', revenue: 0 }, { name: 'Tue', revenue: 0 });
    }
    if (pDist.length === 0) {
      pDist.push({ name: 'Kacchi Ghani', value: 1 });
    }

    return { dailyRevenue: daily, monthlyRevenue: monthly, yearlyRevenue: yearly, todaysOrders: todaysOrdersCount, pendingOrders: pending, salesData: sData, productDistribution: pDist };
  }, [orders, selectedDayObj, selectedMonthObj, selectedYearObj]);

  const handleUpdateStock = async () => {
    try {
      const res = await fetch(`${API_URL}/stock`, {
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
      }
    } catch (e) {
      console.error("Stock update failed", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error("Failed to fetch users");
    }
  };

  React.useEffect(() => {
    if (activeTab === 'customers' && usersList.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase().trim();
    
    let matchesSearch = true;
    if (query) {
      if (query === 'pending') {
        matchesSearch = order.status !== 'Accepted' && order.status !== 'Verified' && order.status !== 'Rejected';
      } else {
        matchesSearch = order.id.toLowerCase().includes(query) || 
               order.user.name.toLowerCase().includes(query) || 
               order.status.toLowerCase().includes(query);
      }
    }
           
    if (!matchesSearch) return false;

    if (activeDateFilter === 'all') return true;

    const orderDate = new Date(order.date);
    const oYear = orderDate.getFullYear();
    const oMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
    const oDay = String(orderDate.getDate()).padStart(2, '0');

    if (activeDateFilter === 'daily') {
      const oDayStrSel = `${selectedDayObj.getFullYear()}-${String(selectedDayObj.getMonth() + 1).padStart(2, '0')}-${String(selectedDayObj.getDate()).padStart(2, '0')}`;
      return `${oYear}-${oMonth}-${oDay}` === oDayStrSel;
    }
    
    if (activeDateFilter === 'today') {
      const actToday = new Date();
      const actTodayStr = `${actToday.getFullYear()}-${String(actToday.getMonth() + 1).padStart(2, '0')}-${String(actToday.getDate()).padStart(2, '0')}`;
      return `${oYear}-${oMonth}-${oDay}` === actTodayStr;
    }

    if (activeDateFilter === 'monthly') {
      const oMonthStrSel = `${selectedMonthObj.getFullYear()}-${String(selectedMonthObj.getMonth() + 1).padStart(2, '0')}`;
      return `${oYear}-${oMonth}` === oMonthStrSel;
    }

    return true;
  });

  const renderOverview = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          className="glass-card bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:border-green-500/30"
          onClick={(e) => {
            if (e.target.tagName === 'INPUT' || e.target.closest('.react-datepicker')) return;
            setActiveDateFilter('daily');
            setActiveTab('dispatch');
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Daily Revenue</h3>
              <DatePicker 
                selected={selectedDayObj}
                onChange={(date) => setSelectedDayObj(date)}
                maxDate={new Date()}
                className="mt-1 bg-transparent text-xs text-slate-300 border-b border-white/10 outline-none cursor-pointer focus:border-green-500 transition-colors w-24"
                dateFormat="dd MMM yyyy"
                portalId="root-portal"
              />
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-display font-black text-white">₹{dailyRevenue.toLocaleString()}</p>
        </div>

        <div 
          className="glass-card bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:border-emerald-500/30"
          onClick={(e) => {
            if (e.target.tagName === 'INPUT' || e.target.closest('.react-datepicker')) return;
            setActiveDateFilter('monthly');
            setActiveTab('dispatch');
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Monthly Revenue</h3>
              <DatePicker 
                selected={selectedMonthObj}
                onChange={(date) => setSelectedMonthObj(date)}
                maxDate={new Date()}
                showMonthYearPicker
                className="mt-1 bg-transparent text-xs text-slate-300 border-b border-white/10 outline-none cursor-pointer focus:border-emerald-500 transition-colors w-24"
                dateFormat="MMM yyyy"
                portalId="root-portal"
              />
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-display font-black text-white">₹{monthlyRevenue.toLocaleString()}</p>
        </div>

        <div className="glass-card bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Yearly Revenue</h3>
              <DatePicker 
                selected={selectedYearObj}
                onChange={(date) => setSelectedYearObj(date)}
                maxDate={new Date()}
                showYearPicker
                className="mt-1 bg-transparent text-xs text-slate-300 border-b border-white/10 outline-none cursor-pointer focus:border-teal-500 transition-colors w-16"
                dateFormat="yyyy"
                portalId="root-portal"
              />
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30 text-teal-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-display font-black text-white">₹{yearlyRevenue.toLocaleString()}</p>
        </div>

        <div 
          className="glass-card bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:border-amber-500/30"
          onClick={() => {
            setSearchQuery('pending');
            setActiveDateFilter('all');
            setActiveTab('dispatch');
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Orders</h3>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-display font-black text-white">{pendingOrders}</p>
        </div>

        <div 
          className="glass-card bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group cursor-pointer hover:border-blue-500/30"
          onClick={() => {
            setActiveDateFilter('today');
            setActiveTab('dispatch');
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Today's Orders</h3>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-display font-black text-white">{todaysOrders}</p>
        </div>

        <div className="glass-card bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Stock Alerts</h3>
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30 text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-4xl font-display font-black text-white">
            {stock.filter(s => s.available_liters < 100).length}
          </p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[400px] flex flex-col">
           <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-mustard-500"/> Revenue Trend</h3>
           </div>
           <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card bg-white/5 border border-white/10 rounded-3xl p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-mustard-500"/> Products Sold</h3>
           </div>
           <div className="flex-1 min-h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {productDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-4 flex-shrink-0">
            {productDistribution.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
                <span>{entry.value} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStock = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card bg-white/5 border border-white/10 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Live Factory Inventory</h2>
            <p className="text-slate-400 mt-1">Monitor real-time liters available in tanks and log daily production.</p>
          </div>
          <div className="w-12 h-12 bg-mustard-500/20 rounded-2xl flex items-center justify-center border border-mustard-500/30">
            <Database className="w-6 h-6 text-mustard-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stock.map((item) => {
            const capacity = 10000; // Assume 10k liter capacity
            const percentage = Math.min((item.available_liters / capacity) * 100, 100);
            const isLow = item.available_liters < 500;
            
            return (
              <div key={item.id} className="p-6 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${isLow ? 'bg-red-500' : 'bg-mustard-500'}`} style={{ width: `${percentage}%`, transition: 'width 1s ease-in-out' }} />
                
                <h3 className="text-lg font-bold text-white mb-6 h-14">{item.product_name}</h3>
                
                {editingStock?.product_name === item.product_name ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="number"
                      value={editingStock.available_liters}
                      onChange={(e) => setEditingStock({...editingStock, available_liters: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-black border border-mustard-500 text-white font-bold"
                    />
                    <button onClick={handleUpdateStock} className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600"><Save className="w-5 h-5"/></button>
                    <button onClick={() => setEditingStock(null)} className="p-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600"><XCircle className="w-5 h-5"/></button>
                  </div>
                ) : (
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-sm text-slate-400 font-semibold mb-1">Available Volume</p>
                      <h3 className={`text-4xl font-black ${isLow ? 'text-red-500' : 'text-mustard-400'}`}>
                        {item.available_liters.toLocaleString()} <span className="text-sm font-medium text-slate-500">L</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 font-mono">UPDATED: {new Date(item.last_updated).toLocaleTimeString()}</p>
                    </div>
                    <button onClick={() => setEditingStock(item)} className="p-3 bg-white/5 text-slate-300 rounded-xl hover:bg-mustard-500 hover:text-black transition-colors">
                      <Edit3 className="w-5 h-5"/>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderDispatch = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-mustard-500 focus:ring-1 focus:ring-mustard-500 transition-all outline-none"
          />
        </div>
        {activeDateFilter !== 'all' && (
          <button 
            onClick={() => setActiveDateFilter('all')}
            className="px-6 py-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Clear Filter
          </button>
        )}
      </div>

      <div className="glass-card bg-white/5 border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-black/40 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
            <tr>
              <th className="py-6 px-8">Order ID & Date</th>
              <th className="py-6 px-8">Customer</th>
              <th className="py-6 px-8">Status</th>
              <th className="py-6 px-8 text-right">Amount</th>
              <th className="py-6 px-8 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                <td className="py-5 px-8">
                  <p className="font-bold text-white font-mono">{order.id}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(order.date).toLocaleString()}</p>
                </td>
                <td className="py-5 px-8">
                  <p className="font-bold text-slate-200">{order.user.name}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{order.address}</p>
                </td>
                <td className="py-5 px-8">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                    (order.status === 'Accepted' || order.status === 'Verified') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    order.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                      {order.status}
                  </span>
                </td>
                <td className="py-5 px-8 text-right font-bold text-white">
                  ₹{order.total.toLocaleString()}
                </td>
                <td className="py-5 px-8">
                  <div className="flex justify-center gap-2">
                    {(order.status !== 'Accepted' && order.status !== 'Verified' && order.status !== 'Rejected') && (
                      <>
                        <button onClick={() => handleUpdateStatus(order.id, 'Accepted')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                          ACCEPT
                        </button>
                        <button onClick={() => handleUpdateStatus(order.id, 'Rejected')} className="px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition-colors border border-red-500/30">
                          REJECT
                        </button>
                      </>
                    )}
                    {(order.status === 'Accepted' || order.status === 'Verified') && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Processed</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderCustomers = () => {
    const filteredUsers = usersList.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-mustard-500 focus:ring-1 focus:ring-mustard-500 transition-all outline-none"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {['all', 'shopkeeper', 'customer'].map((role) => (
              <button
                key={role}
                onClick={() => setUserRoleFilter(role)}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                  userRoleFilter === role 
                    ? 'bg-mustard-500 text-black shadow-lg shadow-mustard-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                {role === 'all' ? 'All Roles' : role + 's'}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card bg-white/5 border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/40 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="py-6 px-8">User Details</th>
                <th className="py-6 px-8">Email</th>
                <th className="py-6 px-8">Registration</th>
                <th className="py-6 px-8 text-right">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-5 px-8">
                    <p className="font-bold text-white capitalize">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">ID: {item.id}</p>
                  </td>
                  <td className="py-5 px-8 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-mustard-500" /> {item.email}
                    </div>
                  </td>
                  <td className="py-5 px-8 text-slate-400 text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-5 px-8 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      item.role === 'shopkeeper'
                        ? 'bg-mustard-500/10 text-mustard-400 border-mustard-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {item.role === 'shopkeeper' ? <Store className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {item.role}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[#0a0500] selection:bg-mustard-500/30">
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-mustard-500 text-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">Admin Access</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500 font-bold uppercase tracking-widest">System Online</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">
              Factory <span className="text-transparent bg-clip-text bg-gradient-to-r from-mustard-600 to-amber-500">Command</span>
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-max">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-mustard-500 text-black shadow-lg shadow-mustard-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button onClick={() => setActiveTab('stock')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'stock' ? 'bg-mustard-500 text-black shadow-lg shadow-mustard-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Database className="w-4 h-4" /> Production & Stock
          </button>
          <button onClick={() => setActiveTab('dispatch')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'dispatch' ? 'bg-mustard-500 text-black shadow-lg shadow-mustard-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Truck className="w-4 h-4" /> Dispatch Orders
          </button>
          <button onClick={() => setActiveTab('customers')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'customers' ? 'bg-mustard-500 text-black shadow-lg shadow-mustard-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Users className="w-4 h-4" /> Customers
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <motion.div key="overview">{renderOverview()}</motion.div>}
          {activeTab === 'stock' && <motion.div key="stock">{renderStock()}</motion.div>}
          {activeTab === 'dispatch' && <motion.div key="dispatch">{renderDispatch()}</motion.div>}
          {activeTab === 'customers' && <motion.div key="customers">{renderCustomers()}</motion.div>}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AdminDashboard;
