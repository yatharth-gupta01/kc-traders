import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import Users from './pages/Users';
import LoadingScreen from './components/LoadingScreen';
import CartSidebar from './components/CartSidebar';

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
  }, []);

  return (
    <>
      <ScrollToTop />
      {loading ? (
        <LoadingScreen onComplete={() => setLoading(false)} />
      ) : (
        <div className="relative w-full overflow-hidden flex flex-col min-h-screen">
          <Navbar />
          <CartSidebar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
            </Routes>
          </main>

          <Footer />
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
