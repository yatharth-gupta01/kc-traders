import { API_URL } from '../config/api';
import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check localStorage on initial load
    const token = localStorage.getItem('kc_token');
    const storedUser = localStorage.getItem('kc_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Global listener for API client forced logouts
    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('kc-logout', handleLogoutEvent);
    return () => window.removeEventListener('kc-logout', handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        const newUser = { 
          role: data.role, 
          name: data.name, 
          token: data.token,
          refreshToken: data.refreshToken // Fallback for Capacitor clients
        };
        setUser(newUser);
        localStorage.setItem('kc_token', data.token);
        localStorage.setItem('kc_user', JSON.stringify(newUser));
        return { success: true, role: data.role };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: "Network Error: Could not reach the server." };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      return res.ok ? { success: true } : { success: false, error: data.error };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Network Error: Could not reach the server." };
    }
  };

  const logout = async () => {
    const localUser = localStorage.getItem('kc_user');
    const refreshToken = localUser ? JSON.parse(localUser).refreshToken : null;
    
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    
    setUser(null);
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_user');
    localStorage.removeItem('kc_cart');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
