import { API_URL } from '../config/api';
import { createContext, useContext, useState, useEffect } from 'react';

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
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        const newUser = { role: data.role, name: data.name, token: data.token };
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
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      return res.ok ? { success: true } : { success: false, error: data.error };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Network Error: Could not reach the server." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_user');
    localStorage.removeItem('kc_cart');
    window.dispatchEvent(new Event('kc-logout'));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
