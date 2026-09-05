import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, MapPin, Phone, Calendar, ArrowLeft, ShieldCheck, Zap, Activity, Loader2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, getProviderBadge } from '../../utils/formatters';

export const CustomerConnection = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/customers/profile');
        if (res.success) {
          setProfile(res.customer);
        }
      } catch (err) {
        console.warn('Profile fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const conn = profile?.connection;
  const provider = profile?.providerId;
  const plan = profile?.planId;
  const providerBadge = getProviderBadge(provider);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <StatusBadge status={conn?.status || profile?.status || 'ACTIVE'} size="sm" />
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
          My Broadband & Cable Connection
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View active line parameters, assigned ISP, hardware specs, and renewal dates.
        </p>
      </div>

      {/* Main Connection Spec Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {/* Top Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${providerBadge.bg} ${providerBadge.textColor}`}>
                {provider?.name || 'Broadband'}
              </span>
              <h2 className="text-xl font-black font-['Plus_Jakarta_Sans'] mt-1">
                {plan?.name || 'Fiber Plan'}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Allocated Speed</span>
            <span className="text-xl font-extrabold text-sky-400 font-mono">
              {plan?.speed || '100 Mbps'}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 divide-y divide-slate-100 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Subscriber Name</span>
              <span className="font-bold text-slate-900 text-sm">{profile?.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Registered Mobile</span>
              <span className="font-mono font-bold text-slate-900 text-sm">+91 {profile?.phone}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Connection ID</span>
              <span className="font-mono font-black text-sky-600 text-base">{profile?.connectionId}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Monthly Subscription</span>
              <span className="font-mono font-black text-slate-900 text-base">
                {formatCurrency(profile?.monthlyAmount || plan?.monthlyPrice)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Installation Date</span>
              <span className="font-semibold text-slate-800">{formatDate(conn?.installationDate || profile?.joiningDate)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Default Billing Day</span>
              <span className="font-semibold text-slate-800">{profile?.dueDay || 10}th of every month</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Dues Status</span>
              <span className={`font-bold ${profile?.totalPending > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {profile?.totalPending > 0
                  ? `Pending (${formatCurrency(profile?.totalPending)})`
                  : 'All Cleared (Paid ✓)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Static/IP Assigned</span>
              <span className="font-mono text-slate-700">{conn?.ipAddress || 'DHCP Dynamic Pool'}</span>
            </div>
          </div>

          <div className="pt-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
              Installation Physical Address
            </span>
            <div className="flex items-start gap-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{profile?.address}, {profile?.area}</span>
            </div>
          </div>
        </div>

        {/* Footer Support Prompt */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Need line shift, speed upgrade or ONT assistance?</span>
          <Link to="/customer/support" className="font-bold text-sky-600 hover:underline">
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerConnection;
