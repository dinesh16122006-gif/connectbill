import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('connectbill_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('connectbill_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await axiosClient.get('/auth/me');
        if (data.success) {
          setUser(data.user);
          if (data.customer) {
            setCustomer(data.customer);
          }
        }
      } catch (err) {
        console.warn('Session restoration failed:', err.message);
        localStorage.removeItem('connectbill_token');
        localStorage.removeItem('connectbill_user');
        localStorage.removeItem('connectbill_customer');
        setUser(null);
        setCustomer(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Admin login
  const adminLogin = async (identifier, password) => {
    const data = await axiosClient.post('/auth/admin/login', { identifier, password });
    if (data.success) {
      localStorage.setItem('connectbill_token', data.token);
      localStorage.setItem('connectbill_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setCustomer(null);
      return data;
    }
    throw new Error(data.message || 'Login failed.');
  };

  // Customer verify OTP & login
  const customerLogin = async (phone, otp) => {
    const data = await axiosClient.post('/auth/customer/verify-otp', { phone, otp });
    if (data.success) {
      localStorage.setItem('connectbill_token', data.token);
      localStorage.setItem('connectbill_customer', JSON.stringify(data.customer));
      setToken(data.token);
      setUser({ role: 'CUSTOMER', name: data.customer.name, phone: data.customer.phone });
      setCustomer(data.customer);
      return data;
    }
    throw new Error(data.message || 'OTP verification failed.');
  };

  // Send OTP
  const sendCustomerOtp = async (phone) => {
    return await axiosClient.post('/auth/customer/send-otp', { phone });
  };

  // Logout
  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('connectbill_token');
    localStorage.removeItem('connectbill_user');
    localStorage.removeItem('connectbill_customer');
    setToken(null);
    setUser(null);
    setCustomer(null);
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isCustomer = role === 'CUSTOMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        token,
        loading,
        role,
        isAdmin,
        isCustomer,
        adminLogin,
        customerLogin,
        sendCustomerOtp,
        logout,
        setCustomer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
