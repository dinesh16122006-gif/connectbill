import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, AlertCircle, History, Wifi, LifeBuoy } from 'lucide-react';

export const CustomerBottomNav = () => {
  const navItems = [
    { label: 'Home', path: '/customer/dashboard', icon: Home },
    { label: 'Bill', path: '/customer/current-bill', icon: FileText },
    { label: 'Pending', path: '/customer/pending-bills', icon: AlertCircle },
    { label: 'History', path: '/customer/payment-history', icon: History },
    { label: 'Connection', path: '/customer/connection', icon: Wifi },
    { label: 'Support', path: '/customer/support', icon: LifeBuoy }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 md:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-sky-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default CustomerBottomNav;
