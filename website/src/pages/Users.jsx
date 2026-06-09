import { API_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User, Store, ShieldAlert, Users as UsersIcon, Mail, Clock, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'shopkeeper', 'customer'
  const [isLoading, setIsLoading] = useState(true);

  // Securely kick out non-admins
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !user.token) return;
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/users`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsersList(data);
        }
      } catch (e) {
        console.error("Failed to fetch user directory:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  if (!user || user.role !== 'admin') return null;

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const shopkeeperCount = usersList.filter(u => u.role === 'shopkeeper').length;
  const customerCount = usersList.filter(u => u.role === 'customer').length;

  return (
    <div className="min-h-screen pt-32 pb-24 bg-slate-50 dark:bg-earth-dark">
      <div className="container mx-auto px-6 lg:px-12">
        
        {/* Back Link to Dashboard */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-bold text-mustard-600 dark:text-mustard-400 hover:text-mustard-700 dark:hover:text-mustard-300 transition-colors uppercase tracking-widest mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
              User <span className="text-gradient">Directory</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage and view all registered shopkeepers (B2B) and retail customers.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl px-5 py-3 backdrop-blur-md shadow-sm">
            <UsersIcon className="w-5 h-5 text-mustard-500" />
            <div className="text-sm">
               <span className="font-bold text-slate-900 dark:text-white">{usersList.length}</span>
               <span className="text-xs text-slate-500 ml-1">Total Users</span>
            </div>
          </div>
        </div>

        {/* Quick Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {/* Shopkeepers Card */}
          <div className="glass-card bg-white dark:bg-black/30 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-mustard-100 dark:bg-mustard-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-mustard-600 dark:text-mustard-400">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Wholesalers / Shopkeepers</p>
              <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white">{shopkeeperCount} <span className="text-xs font-semibold text-slate-400">Partners</span></h3>
            </div>
          </div>

          {/* Customers Card */}
          <div className="glass-card bg-white dark:bg-black/30 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
              <User className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Retail Customers</p>
              <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white">{customerCount} <span className="text-xs font-semibold text-slate-400">Consumers</span></h3>
            </div>
          </div>

          {/* Seed Alert Badge */}
          <div className="glass-card bg-white dark:bg-black/30 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-5 sm:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">GDPR Compliance Mode</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All data strictly hashed & encrypted.</p>
            </div>
          </div>

        </div>

        {/* Filter and Search Bar */}
        <div className="glass-card bg-white dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
          
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-mustard-500 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* Role Filter Buttons */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {['all', 'shopkeeper', 'customer'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  roleFilter === role 
                    ? 'bg-slate-900 dark:bg-mustard-500 text-white dark:text-slate-900 shadow-md' 
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                {role === 'all' ? 'All Roles' : role + 's'}
              </button>
            ))}
          </div>

        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="text-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mustard-500 mx-auto"></div>
             <p className="text-slate-500 dark:text-slate-400 mt-4 font-semibold">Loading user registry...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl p-16 text-center text-slate-500">
             <Search className="w-12 h-12 mx-auto mb-4 opacity-25" />
             <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">No users match your criteria.</p>
             <p className="text-sm mt-1 text-slate-400">Try broadening your search term or selection.</p>
          </div>
        ) : (
          <div className="glass-card bg-white dark:bg-black/30 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-black/40 border-b border-slate-100 dark:border-white/5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="py-5 px-6">ID</th>
                  <th className="py-5 px-6">Name</th>
                  <th className="py-5 px-6">Email Address</th>
                  <th className="py-5 px-6">Registration Date</th>
                  <th className="py-5 px-6 text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-400 dark:text-slate-500">
                      #{item.id}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-white capitalize">{item.name}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{item.email}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        item.role === 'shopkeeper'
                          ? 'bg-mustard-50 dark:bg-mustard-900/10 text-mustard-700 dark:text-mustard-400 border-mustard-200 dark:border-mustard-900/30'
                          : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                      }`}>
                        {item.role === 'shopkeeper' ? <Store className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {item.role}
                      </span>
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

export default Users;
