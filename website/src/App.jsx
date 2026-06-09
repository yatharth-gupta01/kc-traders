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

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function AppContent() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    document.documentElement.classList.add('dark');

    // Capacitor Native Setup
    if (Capacitor.isNativePlatform()) {
      // Hide Splash screen once React is mounted and animation is ready
      setTimeout(() => {
        SplashScreen.hide();
      }, 1000);
    }
  }, []);

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
