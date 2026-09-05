import React, { useState, useEffect } from 'react';
import { Coins, CreditCard, Smartphone, Building2, Wallet, Calendar, Loader2, Download, ArrowUpRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const AdminCollections = () => {
  const [period, setPeriod] = useState('TODAY'); // 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ period });
      if (period === 'CUSTOM' && startDate && endDate) {
        query.append('startDate', startDate);
        query.append('endDate', endDate);
      }

      const res = await axiosClient.get(`/reports/collections?${query.toString()}`);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load collections report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'CUSTOM' || (startDate && endDate)) {
      fetchCollections();
    }
  }, [period, startDate, endDate]);

  const breakdown = data?.breakdown || {};
  const payments = data?.payments || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Daily & Periodic Collections Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cash drawers, counter receipts, and UPI/gateway reconciliations.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
          {[
            { label: "Today", value: 'TODAY' },
            { label: 'This Week', value: 'WEEK' },
            { label: 'This Month', value: 'MONTH' },
            { label: 'Custom Range', value: 'CUSTOM' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                period === item.value
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Pickers */}
      {period === 'CUSTOM' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-600">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <>
          {/* Main Total Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 block mb-1">
                {period === 'TODAY' ? "Today's Total Collection" : period === 'WEEK' ? "This Week's Collection" : period === 'MONTH' ? "This Month's Collection" : "Selected Range Collection"}
              </span>
              <div className="text-4xl sm:text-5xl font-black font-['Plus_Jakarta_Sans'] font-mono text-white tracking-tight">
                {formatCurrency(breakdown.total || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Settled across <strong>{breakdown.transactionCount || 0}</strong> verified subscriber transactions
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-4 py-2 rounded-xl">
              <Coins className="w-4 h-4" />
              <span>100% Reconciled In Realtime</span>
            </div>
          </div>

          {/* Breakdown by Mode */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cash */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cash (Counter)
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(breakdown.cash || 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Physical Drawer Inflow</span>
            </div>

            {/* UPI */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  UPI Direct (QR)
                </span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(breakdown.upi || 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">GPay, PhonePe, Paytm</span>
            </div>

            {/* Online */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cards / NetBanking
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(breakdown.online || 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Razorpay Gateway Checkout</span>
            </div>

            {/* Bank Transfer */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bank Transfer / NEFT
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(breakdown.bank || 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Direct Account Credits</span>
            </div>
          </div>

          {/* Detailed Transaction List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Period Payment Entries ({payments.length})
            </h3>

            {payments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No collection entries for this period.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
                  <div key={p._id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{p.customerId?.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        {p.customerId?.connectionId} • {formatDate(p.paymentDate)} • #{p.transactionId}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                      <span className="font-mono font-black text-emerald-600 text-sm">
                        {formatCurrency(p.amount)}
                      </span>
                      <Link
                        to={`/customer/receipt/${p._id}`}
                        target="_blank"
                        className="p-1 text-slate-400 hover:text-sky-600"
                        title="Download Receipt"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCollections;
