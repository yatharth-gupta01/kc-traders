import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import Users from './pages/Users';
import Wishlist from './pages/Wishlist';
import LoadingScreen from './components/LoadingScreen';
import CartSidebar from './components/CartSidebar';
import { WishlistProvider } from './context/WishlistContext';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import ErrorBoundary from './components/ErrorBoundary';
import CategoriesScreen from './pages/CategoriesScreen';
import CartScreen from './pages/CartScreen';
import OrderTrackingScreen from './pages/OrderTrackingScreen';
import QRScannerScreen from './pages/QRScannerScreen';
import VoiceSearchScreen from './pages/VoiceSearchScreen';
import NotificationCenter from './pages/NotificationCenter';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    document.documentElement.classList.add('dark');

    // Capacitor Native Setup
    if (Capacitor.isNativePlatform()) {
      // Hide Splash screen once React is mounted and animation is ready
      setTimeout(() => {
        SplashScreen.hide();
      }, 1000);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-[#0a0503] flex flex-col items-center justify-center p-6 text-center select-none text-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-center justify-center text-red-500 mb-6 animate-pulse-soft"
        >
          <WifiOff className="w-10 h-10" />
        </motion.div>
        <h1 className="text-2xl font-display font-black tracking-tight mb-2 uppercase">No connection</h1>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-8">
          The KC Traders purity pipeline has disconnected. Reconnect to view live factory stock and place orders.
        </p>
        <button 
          onClick={() => setIsOnline(navigator.onLine)}
          className="px-6 py-3 bg-mustard-500 hover:bg-mustard-600 text-slate-900 font-bold rounded-xl transition shadow-lg flex items-center gap-2 text-sm active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      {loading ? (
        <LoadingScreen onComplete={() => setLoading(false)} />
      ) : (
        <div className="relative w-full overflow-x-clip flex flex-col min-h-screen">
          <Navbar />
          <CartSidebar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/shop/:id" element={<ProductDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/users" element={<Users />} />
               <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/categories" element={<CategoriesScreen />} />
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/order-tracking" element={<OrderTrackingScreen />} />
              <Route path="/qr-scanner" element={<QRScannerScreen />} />
              <Route path="/voice-search" element={<VoiceSearchScreen />} />
              <Route path="/notifications" element={<NotificationCenter />} />
            </Routes>
          </main>

          <Footer />
          <BottomNav />
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
