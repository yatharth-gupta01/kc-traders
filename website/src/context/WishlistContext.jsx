import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { user } = useAuth();
  const [prevUser, setPrevUser] = useState(user);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user || !user.token) return;
      try {
        const res = await fetch('http://localhost:5000/api/wishlist', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWishlistItems(data);
        }
      } catch (e) {
        console.error("Failed to fetch wishlist", e);
      }
    };

    if (user) {
      fetchWishlist();
    }
  }, [user]);

  useEffect(() => {
    if (prevUser && !user) {
      setWishlistItems([]);
    }
    setPrevUser(user);
  }, [user, prevUser]);

  const addToWishlist = async (productId, variantId) => {
    if (!user) return false;

    // Optimistic UI update
    setWishlistItems(prev => [...prev, { product_id: productId, variant_id: variantId }]);

    try {
      const res = await fetch('http://localhost:5000/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ product_id: productId, variant_id: variantId })
      });
      if (!res.ok) {
        // Revert on failure
        setWishlistItems(prev => prev.filter(i => i.variant_id !== variantId));
        return false;
      }
      return true;
    } catch (e) {
      setWishlistItems(prev => prev.filter(i => i.variant_id !== variantId));
      return false;
    }
  };

  const removeFromWishlist = async (variantId) => {
    if (!user) return false;

    const previousItems = [...wishlistItems];
    setWishlistItems(prev => prev.filter(item => item.variant_id !== variantId));

    try {
      const res = await fetch(`http://localhost:5000/api/wishlist/${variantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (!res.ok) {
        setWishlistItems(previousItems);
        return false;
      }
      return true;
    } catch (e) {
      setWishlistItems(previousItems);
      return false;
    }
  };

  const isInWishlist = (variantId) => {
    return wishlistItems.some(item => item.variant_id === variantId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
