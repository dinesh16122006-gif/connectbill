import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Search, Download, Filter, Loader2, ArrowUpRight, Calendar } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (methodFilter !== 'ALL') query.append('paymentMethod', methodFilter);
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await axiosClient.get(`/payments?${query.toString()}`);
      if (res.success) {
        setPayments(res.payments || []);
      }
    } catch (err) {
      toast.error('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter, startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(fetchPayments, 300);
    return () => clearTimeout(t);
  }, [search]);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Payments & Collections Audit Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction ledger for online gateway settlements, UPI, and counter cash payments.
          </p>
        </div>

        <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase">Filtered Total</span>
          <span className="text-lg font-black text-emerald-600 font-mono">
            {formatCurrency(totalCollected)}
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search txn ID, receipt, subscriber..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Method */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="ONLINE">Cards / NetBanking</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

          {/* Date pickers */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px]"
              title="Start Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px]"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Payments Recorded</h3>
          <p className="text-xs text-slate-500 mt-1">No collections match the specified filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Transaction ID</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Subscriber</th>
                  <th className="px-5 py-3.5">Bill Month</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Mode</th>
                  <th className="px-5 py-3.5">Settlement Status</th>
                  <th className="px-5 py-3.5 text-right">Digital Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {p.transactionId}
                      {p.gatewayPaymentId && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {p.gatewayPaymentId}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/customers/${p.customerId?._id}`}
                        className="font-bold text-slate-900 hover:text-sky-600 block"
                      >
                        {p.customerId?.name || 'Customer'}
                      </Link>
                      <span className="text-slate-400 text-[11px] font-mono">{p.customerId?.connectionId}</span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {p.billId?.billingMonthName || 'Monthly Bill'}
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {p.billId?.billNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono font-black text-emerald-600 text-sm">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} size="xs" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/customer/receipt/${p._id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-semibold text-xs transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
