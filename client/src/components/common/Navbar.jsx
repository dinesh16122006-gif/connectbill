import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wifi, Menu, X, User, Shield, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, isCustomer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
                Connect<span className="text-sky-600">Bill</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Internet & Cable Billing
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="/#home" className="hover:text-sky-600 transition-colors">Home</a>
            <a href="/#features" className="hover:text-sky-600 transition-colors">Features</a>
            <a href="/#services" className="hover:text-sky-600 transition-colors">Services</a>
            <a href="/#contact" className="hover:text-sky-600 transition-colors">Contact</a>
          </nav>

          {/* Action / Auth Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Portal
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-rose-600 font-semibold px-2 py-1 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : isCustomer ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/customer/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition-all shadow-sm shadow-sky-600/20"
                >
                  <User className="w-3.5 h-3.5" />
                  My Portal
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-rose-600 font-semibold px-2 py-1 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/customer/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  Customer Login
                </Link>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col gap-2 font-medium text-sm text-slate-700">
            <a
              href="/#home"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Home
            </a>
            <a
              href="/#features"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="/#services"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Services
            </a>
            <a
              href="/#contact"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Contact
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/customer/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200"
            >
              Customer Login
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200"
            >
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
