import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems } = useCart();
  
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-6 h-6" /> },
    { name: 'Shop', path: '/shop', icon: <ShoppingBag className="w-6 h-6" /> },
    { 
      name: 'Cart', 
      path: '/checkout', 
      icon: (
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-mustard-500 text-black text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {cartItemCount}
            </span>
          )}
        </div>
      ) 
    },
    { 
      name: 'Account', 
      path: user ? '/dashboard' : '/login', 
      icon: <User className="w-6 h-6" /> 
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-[#1a1412] border-t border-slate-200 dark:border-white/10 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname.startsWith('/dashboard'));
          
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full relative ${
                isActive ? 'text-mustard-500' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 w-8 h-1 bg-mustard-500 rounded-b-full"
                />
              )}
              <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'opacity-100 mt-1' : 'opacity-0 h-0 overflow-hidden absolute'}`}>
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
