import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, User, X, FileText, CreditCard, ArrowRight, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export const AdminHeader = ({ setMobileOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Handle global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const data = await axiosClient.get(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (data.success) {
          setSearchResults(data.results);
          setShowResults(true);
        }
      } catch (err) {
        console.warn('Search failed:', err.message);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch admin notifications
  const fetchNotifications = async () => {
    try {
      const data = await axiosClient.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      // Ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Box */}
        <div ref={searchRef} className="relative w-full max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowResults(true);
              }}
              placeholder="Search customers, mobile, connection ID, bill, payment..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-sky-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2 text-xs">
                {/* Customers */}
                {searchResults.customers?.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Customers ({searchResults.customers.length})
                    </div>
                    {searchResults.customers.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery('');
                          navigate(`/admin/customers/${c._id}`);
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-sky-50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-sky-600" />
                          <div>
                            <span className="font-bold text-slate-800">{c.name}</span>
                            <span className="ml-2 font-mono text-slate-500">{c.phone}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-sky-600">
                          {c.connectionId}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Bills */}
                {searchResults.bills?.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Bills ({searchResults.bills.length})
                    </div>
                    {searchResults.bills.map((b) => (
                      <button
                        key={b._id}
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery('');
                          navigate(`/admin/bills`);
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-sky-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-slate-800 font-mono">{b.billNumber}</span>
                            <span className="ml-2 text-slate-500">({b.billingMonthName})</span>
                          </div>
                        </div>
                        <span className="text-slate-600 font-bold">₹{b.totalAmount}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Payments */}
                {searchResults.payments?.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Payments ({searchResults.payments.length})
                    </div>
                    {searchResults.payments.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery('');
                          navigate(`/admin/payments`);
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-sky-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-purple-600" />
                          <div>
                            <span className="font-bold font-mono text-slate-800">{p.transactionId}</span>
                            <span className="ml-2 text-slate-500">{p.paymentMethod}</span>
                          </div>
                        </div>
                        <span className="text-emerald-600 font-bold">₹{p.amount}</span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.customers?.length === 0 &&
                  searchResults.bills?.length === 0 &&
                  searchResults.payments?.length === 0 && (
                    <div className="p-4 text-center text-slate-400">
                      No records match "{searchQuery}"
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs && unreadCount > 0) handleMarkAllRead();
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Admin Alerts
                </span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-sky-600 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3.5 text-xs transition-colors ${
                        n.read ? 'bg-white' : 'bg-sky-50/40 font-medium'
                      }`}
                    >
                      <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        {n.title}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Link to Landing */}
        <Link
          to="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span>Live Site</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
};

export default AdminHeader;
