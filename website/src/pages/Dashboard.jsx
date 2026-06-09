import { API_URL } from '../config/api';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CustomerDashboard from './CustomerDashboard';
import ShopkeeperDashboard from './ShopkeeperDashboard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // For Admin only - fetching all orders and stock
  // Ideally, these would also be moved entirely to AdminDashboard,
  // but keeping them here so AdminDashboard signature isn't broken for now.
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchOrders = async () => {
    if (!user || !user.token) return;
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const formattedOrders = data.map(o => ({
          id: o.id,
          date: o.created_at ? o.created_at.replace(' ', 'T') + 'Z' : new Date().toISOString(),
          user: { 
            name: o.userName || user.name,
            email: o.userEmail
          },
          address: o.address_data,
          items: JSON.parse(o.items_data),
          total: o.total_amount,
          status: o.status,
          paymentMethod: o.payment_method
        }));
        setOrders(formattedOrders);
      }
    } catch (e) {
      console.error("Failed to securely pull orders.");
    }
  };

  const fetchStock = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await fetch(`${API_URL}/stock`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStock(data);
      }
    } catch (e) {
      console.error("Failed to fetch stock.");
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders();
      fetchStock();
    }
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
        fetchStock();
      }
    } catch (e) {
      console.error("Failed to update status.");
    }
  };

  if (!user) return null;

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user} 
        logout={logout} 
        orders={orders} 
        stock={stock} 
        fetchOrders={fetchOrders} 
        fetchStock={fetchStock} 
        handleUpdateStatus={handleUpdateStatus} 
      />
    );
  }

  if (user.role === 'shopkeeper') {
    return <ShopkeeperDashboard />;
  }

  return <CustomerDashboard />;
};

export default Dashboard;
