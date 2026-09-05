import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Search, Download, FileText, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CustomerPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/payments');
      if (res.success) {
        setPayments(res.payments || []);
      }
    } catch (err) {
      console.warn('History fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    const matchesSearch =
      !search ||
      (p.transactionId && p.transactionId.toLowerCase().includes(search.toLowerCase())) ||
      (p.billId?.billingMonthName && p.billId.billingMonthName.toLowerCase().includes(search.toLowerCase())) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(search.toLowerCase()));

    return matchesMethod && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
          Payment History & Receipts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View all successful payments, settlement dates, and download digital invoices.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction, receipt..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="ONLINE">Cards / NetBanking</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Payments Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Payment History Available</h3>
          <p className="text-xs text-slate-500 mt-1">
            {search ? 'No payments match your search filter.' : 'Your previous payment records will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Billing Month</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-700 whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {p.billId?.billingMonthName || 'Monthly Bill'}
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {p.billId?.billNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black font-mono text-emerald-600 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} size="xs" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/customer/receipt/${p._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-300 text-slate-700 hover:text-sky-700 font-semibold text-xs transition-colors shadow-2xs"
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

export default CustomerPaymentHistory;
