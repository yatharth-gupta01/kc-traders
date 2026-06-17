import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, Moon, Sun, Droplet, ShoppingBag, LogIn, LogOut, Store, User, Search, Heart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    // Hide navbar when scrolling down (past 100px), show when scrolling up
    if (latest > previous && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });
  
  const { user, logout } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  const { wishlistItems } = useWishlist();
  
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const wishlistItemCount = wishlistItems ? wishlistItems.length : 0;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isMobile && isHome) {
    return null;
  }

  const navLinks = [
    { name: 'Home', href: '/' },
    ...(user?.role?.toLowerCase() === 'admin' 
      ? [
          { name: 'Users', href: '/users' },
          { name: 'Dashboard', href: '/dashboard' }
        ] 
      : (user 
          ? [{ name: 'My Orders', href: '/dashboard' }]
          : []
        )
    ),
    { name: 'Shop Products', href: '/shop' },
    { name: 'Recipes & Blog', href: '/recipes' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header 
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled || !isHome ? 'glass shadow-md border-b border-slate-200 dark:border-white/5' : 'bg-transparent'
      }`}
      style={{
        paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isScrolled || !isHome ? '16px' : '24px'})`,
        paddingBottom: isScrolled || !isHome ? '16px' : '24px'
      }}
    >
      <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center relative">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 z-50 interactive group">
          <div className="relative w-8 h-8 md:w-10 md:h-10 text-mustard-500 overflow-hidden flex items-center justify-center">
            <Droplet className="w-full h-full fill-current group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-mustard-600/30 blur-[2px]" />
          </div>
          <div className="flex flex-col">
            <span className={`font-display font-bold text-xl md:text-2xl leading-none tracking-tight transition-colors ${(!isScrolled && isHome) ? 'text-white' : 'text-slate-900 dark:text-white'}`}>K.C. TRADERS</span>
            <span className="text-[10px] md:text-xs text-mustard-500 font-medium tracking-widest uppercase">Pure Mustard Oil</span>
          </div>
        </Link>

        {/* Centered Desktop Nav */}
        <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <ul className="flex items-center gap-8">
            {navLinks
              .filter(link => !(user?.role?.toLowerCase() === 'admin' && link.name === 'Shop Products'))
              .map((link) => {
                const isActive = location.pathname === link.href;
                const baseText = (!isScrolled && isHome) 
                  ? (isActive ? 'text-mustard-400' : 'text-slate-200 hover:text-mustard-400')
                  : (isActive ? 'text-mustard-600 dark:text-mustard-400' : 'text-slate-700 dark:text-slate-300 hover:text-mustard-600 dark:hover:text-mustard-400');
                
                return (
                  <li key={link.name}>
                    <Link 
                      to={link.href} 
                      className={`text-sm font-semibold transition-colors relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-mustard-500 hover:after:w-full after:transition-all after:duration-300 ${baseText} ${isActive ? 'after:w-full' : 'after:w-0'}`}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
            })}
          </ul>
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-1 justify-end">
          
          {/* Global Search Bar */}
          <div className="relative group hidden lg:block">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-mustard-500 transition-colors" />
            </div>
            <input 
               type="text" 
               placeholder="Search oils..." 
               className={`pl-4 pr-10 py-2 w-48 xl:w-56 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-mustard-500 transition-all ${
                 (!isScrolled && isHome) 
                   ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20' 
                   : 'bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/10 placeholder:text-slate-500 dark:text-white'
               } border`}
            />
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            {user && user.role?.toLowerCase() !== 'admin' && (
              <div className="flex items-center gap-1">
                <Link 
                  to="/wishlist"
                  className={`relative p-2 rounded-full transition-colors interactive group ${(!isScrolled && isHome) ? 'hover:bg-white/10' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 transition-colors group-hover:text-red-500 ${(!isScrolled && isHome) ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`} />
                  {wishlistItemCount > 0 && (
                    <span className="absolute 0 top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {wishlistItemCount}
                    </span>
                  )}
                </Link>
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className={`relative p-2 rounded-full transition-colors interactive ${(!isScrolled && isHome) ? 'hover:bg-white/10' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                  aria-label="Open Cart"
                >
                  <ShoppingBag className={`w-5 h-5 ${(!isScrolled && isHome) ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`} />
                  {cartItemCount > 0 && (
                    <span className="absolute 0 top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-4 h-4 bg-mustard-500 text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {user ? (
              <div className={`flex items-center gap-4 ml-2 border-l pl-4 ${(!isScrolled && isHome) ? 'border-white/20' : 'border-slate-200 dark:border-slate-800'}`}>
                <Link to="/dashboard" className="flex flex-col text-right hover:opacity-80 transition cursor-pointer">
                  <span className={`text-sm font-bold capitalize ${(!isScrolled && isHome) ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{user.name}</span>
                  <span className="text-[10px] flex items-center justify-end gap-1 text-mustard-500 uppercase tracking-widest font-bold">
                    {user.role === 'shopkeeper' ? <Store className="w-3 h-3"/> : <User className="w-3 h-3" />}
                    Dashboard
                  </span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className={`p-2 transition-colors rounded-full interactive ${(!isScrolled && isHome) ? 'bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400' : 'bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-500/10 text-slate-700 hover:text-red-600 dark:text-slate-300'}`}
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="ml-2 flex items-center gap-2 px-6 py-2.5 bg-mustard-500 hover:bg-mustard-600 text-slate-900 text-sm font-bold rounded-full transition-all interactive shadow-lg shadow-mustard-500/20"
              >
                <User className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4 z-50">
          {user && user.role?.toLowerCase() !== 'admin' && (
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
          )}
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
              {navLinks
                 .filter(link => !(user?.role?.toLowerCase() === 'admin' && link.name === 'Shop Products'))
                 .map((link, i) => (
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
    </motion.header>
  );
};

export default Navbar;
