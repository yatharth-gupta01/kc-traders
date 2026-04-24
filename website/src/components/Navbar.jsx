import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Droplet, ShoppingBag, LogIn, LogOut, Store, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop Products', href: '/shop' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isHome ? 'py-3 glass shadow-md border-b border-slate-200 dark:border-white/5' : 'py-5 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 z-50 interactive group">
          <div className="relative w-8 h-8 md:w-10 md:h-10 text-mustard-500 overflow-hidden flex items-center justify-center">
            <Droplet className="w-full h-full fill-current group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-mustard-600/30 blur-[2px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl md:text-2xl leading-none text-slate-900 dark:text-white tracking-tight">K.C. TRADERS</span>
            <span className="text-[10px] md:text-xs text-mustard-600 dark:text-mustard-400 font-medium tracking-widest uppercase">Pure Mustard Oil</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link 
                  to={link.href} 
                  className={`text-sm font-medium transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-mustard-500 hover:after:w-full after:transition-all after:duration-300 ${
                    location.pathname === link.href 
                      ? 'text-mustard-600 dark:text-mustard-400 after:w-full' 
                      : 'text-slate-700 hover:text-mustard-600 dark:text-slate-300 dark:hover:text-mustard-400'
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors interactive"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              {cartItemCount > 0 && (
                <span className="absolute 0 top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-earth-dark">
                  {cartItemCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-4 ml-2 border-l pl-4 border-slate-200 dark:border-slate-800">
                <Link to="/dashboard" className="flex flex-col text-right hover:opacity-80 transition cursor-pointer">
                  <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{user.name}</span>
                  <span className="text-[10px] flex items-center justify-end gap-1 text-mustard-600 dark:text-mustard-400 uppercase tracking-widest font-bold">
                    {user.role === 'shopkeeper' ? <Store className="w-3 h-3"/> : <User className="w-3 h-3" />}
                    {user.role} Dashboard
                  </span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/10 text-slate-700 hover:text-red-600 dark:text-slate-300 transition-colors rounded-full interactive"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="ml-2 flex items-center gap-2 px-5 py-2.5 bg-mustard-50 hover:bg-mustard-100 dark:bg-white/5 dark:hover:bg-white/10 text-mustard-700 dark:text-mustard-400 text-sm font-semibold rounded-full border border-mustard-200 dark:border-white/10 transition-colors interactive"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4 z-50">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-1 interactive"
            aria-label="Open Cart"
          >
            <ShoppingBag className="w-6 h-6 text-slate-800 dark:text-white" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 interactive text-slate-800 dark:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 z-40 bg-white/95 dark:bg-earth-dark/95 backdrop-blur-xl md:hidden pt-24 px-6 flex flex-col"
          >
            <ul className="flex flex-col gap-6 text-center">
              {navLinks.map((link, i) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link 
                    to={link.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl font-display font-medium text-slate-800 dark:text-slate-100"
                  >
                    {link.name}
                  </Link>
                </motion.li>
              ))}
              
              <div className="w-full h-px bg-slate-200 dark:bg-white/10 my-4" />
              
              {user ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center gap-4 mt-2"
                >
                  <Link 
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-mustard-600 dark:text-mustard-400 font-bold uppercase tracking-widest text-sm hover:underline"
                  >
                    {user.role === 'shopkeeper' ? <Store className="w-4 h-4"/> : <User className="w-4 h-4" />}
                    {user.role} Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-8 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 rounded-full font-semibold"
                  >
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                </motion.div>
              ) : (
                <motion.li
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pt-2"
                >
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-mustard-500 text-white dark:text-slate-900 rounded-full font-semibold shadow-lg"
                  >
                    <LogIn className="w-5 h-5" /> Sign In Portal
                  </Link>
                </motion.li>
              )}
            </ul>
            
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
