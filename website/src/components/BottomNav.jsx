import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, Package, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems } = useCart();

  const hideOnRoutes = [
    '/qr-scanner',
    '/voice-search',
    '/order-tracking',
    '/notifications'
  ];
  const shouldHide = hideOnRoutes.includes(location.pathname) || location.pathname.startsWith('/product/');
  if (shouldHide) return null;
  
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Define bottom navigation tabs
  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5.5 h-5.5" /> },
    { name: 'Categories', path: '/categories', icon: <LayoutGrid className="w-5.5 h-5.5" /> },
    { 
      name: 'Cart', 
      path: '/cart', 
      icon: (
        <div className="relative">
          <ShoppingCart className="w-5.5 h-5.5" />
          {cartItemCount > 0 && (
            <motion.span 
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white dark:border-[#1a1412] leading-none"
            >
              {cartItemCount}
            </motion.span>
          )}
        </div>
      ) 
    },
    { 
      name: 'Orders', 
      path: '/dashboard', 
      state: { activeTab: 'orders' },
      icon: <Package className="w-5.5 h-5.5" /> 
    },
    { 
      name: 'Profile', 
      path: user ? '/dashboard' : '/login', 
      state: { activeTab: 'profile' },
      icon: <User className="w-5.5 h-5.5" /> 
    }
  ].filter(item => !(item.name === 'Cart' && user?.role?.toLowerCase() === 'admin'));

  // Helper to determine if a tab is active
  const getIsActive = (item) => {
    if (item.name === 'Profile' && !user) {
      return location.pathname === '/login';
    }
    
    if (item.path === '/dashboard') {
      const currentTab = location.state?.activeTab || 'orders';
      return location.pathname === '/dashboard' && currentTab === item.state?.activeTab;
    }
    
    return location.pathname === item.path;
  };

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex justify-around items-center h-18 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = getIsActive(item);
          
          return (
            <Link 
              key={item.name} 
              to={item.path}
              state={item.state}
              className={`flex flex-col items-center justify-center w-full h-full relative transition-colors duration-300 ${
                isActive ? 'text-mustard-600 dark:text-mustard-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {/* Active Tab Background Capsule */}
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-y-2 inset-x-2 bg-mustard-500/10 dark:bg-mustard-500/10 rounded-2xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon Container */}
              <motion.div 
                animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="mb-0.5"
              >
                {item.icon}
              </motion.div>

              {/* Label */}
              <span className={`text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                isActive ? 'opacity-100 scale-100' : 'opacity-80 scale-95'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
