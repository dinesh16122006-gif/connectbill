import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2, Calendar, AlertCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to update notifications.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            System Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feed of online settlements, overdue alerts, and subscriber events.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4 text-sky-600" />
          <span>Mark All Read</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">You have no alerts at this time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4.5 transition-colors ${
                n.read ? 'bg-white' : 'bg-sky-50/40 font-medium'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        n.type === 'PAYMENT'
                          ? 'bg-emerald-500'
                          : n.type === 'OVERDUE'
                          ? 'bg-rose-500'
                          : 'bg-sky-500'
                      }`}
                    />
                    <h4 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                      {n.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-4">{n.message}</p>
                </div>

                <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
