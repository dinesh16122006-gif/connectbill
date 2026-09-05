import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import CustomerLogin from './pages/auth/CustomerLogin';
import AdminLogin from './pages/auth/AdminLogin';

// Customer Layout & Pages
import CustomerLayout from './components/customer/CustomerLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerCurrentBill from './pages/customer/CustomerCurrentBill';
import CustomerPendingBills from './pages/customer/CustomerPendingBills';
import CustomerPaymentHistory from './pages/customer/CustomerPaymentHistory';
import CustomerConnection from './pages/customer/CustomerConnection';
import CustomerPaymentSuccess from './pages/customer/CustomerPaymentSuccess';
import CustomerReceiptView from './pages/customer/CustomerReceiptView';
import CustomerSupport from './pages/customer/CustomerSupport';

// Admin Layout & Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail';
import AdminConnections from './pages/admin/AdminConnections';
import AdminProviders from './pages/admin/AdminProviders';
import AdminPlans from './pages/admin/AdminPlans';
import AdminBills from './pages/admin/AdminBills';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPendingBills from './pages/admin/AdminPendingBills';
import AdminCollections from './pages/admin/AdminCollections';
import AdminReports from './pages/admin/AdminReports';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSupport from './pages/admin/AdminSupport';
import AdminSettings from './pages/admin/AdminSettings';

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#fff',
              fontSize: '12px',
              borderRadius: '12px',
              fontWeight: 600
            }
          }}
        />
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Customer Portal */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="current-bill" element={<CustomerCurrentBill />} />
            <Route path="pending-bills" element={<CustomerPendingBills />} />
            <Route path="payment-history" element={<CustomerPaymentHistory />} />
            <Route path="connection" element={<CustomerConnection />} />
            <Route path="payment-success" element={<CustomerPaymentSuccess />} />
            <Route path="receipt/:id" element={<CustomerReceiptView />} />
            <Route path="support" element={<CustomerSupport />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id" element={<AdminCustomerDetail />} />
            <Route path="connections" element={<AdminConnections />} />
            <Route path="providers" element={<AdminProviders />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="bills" element={<AdminBills />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="pending-bills" element={<AdminPendingBills />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
