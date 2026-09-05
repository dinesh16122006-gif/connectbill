import React from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import CustomerHeader from './CustomerHeader';
import CustomerBottomNav from './CustomerBottomNav';
import { useAuth } from '../../context/AuthContext';
import { Home, FileText, AlertCircle, History, Wifi, LifeBuoy, Loader2 } from 'lucide-react';

export const CustomerLayout = () => {
  const { isCustomer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!isCustomer) {
    return <Navigate to="/customer/login" replace />;
  }

  const navLinks = [
    { label: 'Dashboard', path: '/customer/dashboard', icon: Home },
    { label: 'Current Bill', path: '/customer/current-bill', icon: FileText },
    { label: 'Pending Bills', path: '/customer/pending-bills', icon: AlertCircle },
    { label: 'Payment History', path: '/customer/payment-history', icon: History },
    { label: 'My Connection', path: '/customer/connection', icon: Wifi },
    { label: 'Support', path: '/customer/support', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-8">
      <CustomerHeader />

      {/* Desktop Subheader Navigation */}
      <div className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 -mb-px overflow-x-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5">
        <Outlet />
      </main>

      <CustomerBottomNav />
    </div>
  );
};

export default CustomerLayout;
