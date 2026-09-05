import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wifi,
  CreditCard,
  History,
  FileText,
  LifeBuoy,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Loader2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import RazorpayCheckoutModal from '../../components/common/RazorpayCheckoutModal';
import { formatCurrency, formatDate, getProviderBadge } from '../../utils/formatters';

export const CustomerDashboard = () => {
  const { customer } = useAuth();
  const [bills, setBills] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment checkout state
  const [checkoutData, setCheckoutData] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [billsRes, paymentsRes] = await Promise.all([
        axiosClient.get('/bills'),
        axiosClient.get('/payments?limit=3')
      ]);

      if (billsRes.success) {
        setBills(billsRes.bills || []);
      }
      if (paymentsRes.success) {
        setRecentPayments(paymentsRes.payments || []);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Most recent bill
  const currentBill = bills[0] || null;

  // Unpaid bills
  const pendingBills = bills.filter((b) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(b.status));
  const totalPendingAmount = pendingBills.reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

  // Handle Pay Now click
  const handlePayBill = async (bill) => {
    try {
      const res = await axiosClient.post('/payments/create-order', {
        billIds: [bill._id]
      });
      if (res.success) {
        setCheckoutData(res);
        setIsCheckoutOpen(true);
      }
    } catch (err) {
      console.error('Order creation failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const providerBadge = getProviderBadge(customer?.provider);

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Greeting */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-600/15 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sky-100 text-xs font-semibold backdrop-blur-xs mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connection Active
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans'] tracking-tight">
            Welcome, {customer?.name || 'Customer'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 mt-1.5 leading-relaxed">
            Connection ID: <strong className="font-mono text-white">{customer?.connectionId}</strong> • {customer?.provider?.name || 'Broadband'}
          </p>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Current Bill Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Bill
                </span>
              </div>
              {currentBill ? (
                <StatusBadge status={currentBill.status} />
              ) : (
                <span className="text-xs text-slate-400">No Bills</span>
              )}
            </div>

            {currentBill ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                      {formatCurrency(currentBill.remainingAmount > 0 ? currentBill.remainingAmount : currentBill.totalAmount)}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {currentBill.billingMonthName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Due Date</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">
                      {formatDate(currentBill.dueDate, 'long')}
                    </span>
                  </div>
                </div>

                {currentBill.status === 'PAID' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold">Bill Fully Paid ✓</span>
                    </div>
                    <Link
                      to={`/customer/receipt/${currentBill._id}`}
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      View Receipt
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => handlePayBill(currentBill)}
                    className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {formatCurrency(currentBill.remainingAmount)} Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No billing statements generated yet.
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/customer/current-bill" className="font-semibold text-sky-600 hover:underline flex items-center gap-1">
              View Itemized Breakdown <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {pendingBills.length > 1 && (
              <Link to="/customer/pending-bills" className="text-amber-600 font-bold hover:underline">
                {pendingBills.length} Pending Bills ({formatCurrency(totalPendingAmount)})
              </Link>
            )}
          </div>
        </div>

        {/* Active Connection Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Connection
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${providerBadge.bg} ${providerBadge.textColor}`}>
                {customer?.provider?.name || 'BSNL/RailWire'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {customer?.plan?.name || 'High Speed Internet'}
                  </div>
                  <span className="text-xs text-slate-500">
                    Speed: <strong className="text-slate-800">{customer?.plan?.speed || '100 Mbps'}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Monthly Price</span>
                  <span className="text-lg font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {formatCurrency(customer?.monthlyAmount || customer?.plan?.monthlyPrice)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Connection ID</span>
                  <span className="font-mono font-bold text-slate-800">{customer?.connectionId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/customer/connection" className="font-semibold text-sky-600 hover:underline flex items-center gap-1">
              Connection Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-slate-400">Fixed Monthly Cycle</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            to="/customer/current-bill"
            className="p-4 bg-white border border-slate-200/90 rounded-2xl text-center hover:border-sky-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Pay Bill</span>
            <span className="text-[10px] text-slate-400">Current Month</span>
          </Link>

          <Link
            to="/customer/pending-bills"
            className="p-4 bg-white border border-slate-200/90 rounded-2xl text-center hover:border-sky-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Pending Bills</span>
            <span className="text-[10px] text-slate-400">Unpaid Balances</span>
          </Link>

          <Link
            to="/customer/payment-history"
            className="p-4 bg-white border border-slate-200/90 rounded-2xl text-center hover:border-sky-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">History</span>
            <span className="text-[10px] text-slate-400">Receipts & Logs</span>
          </Link>

          <Link
            to="/customer/connection"
            className="p-4 bg-white border border-slate-200/90 rounded-2xl text-center hover:border-sky-400 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Wifi className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Connection</span>
            <span className="text-[10px] text-slate-400">Speed & Plan</span>
          </Link>

          <Link
            to="/customer/support"
            className="p-4 bg-white border border-slate-200/90 rounded-2xl text-center hover:border-sky-400 hover:shadow-sm transition-all group col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 block">Support</span>
            <span className="text-[10px] text-slate-400">WhatsApp & Call</span>
          </Link>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Recent Payments
          </h3>
          <Link to="/customer/payment-history" className="text-xs font-semibold text-sky-600 hover:underline">
            View All →
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No payment records found yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentPayments.map((payment) => (
              <div key={payment._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">
                    {payment.billId?.billingMonthName || 'Monthly Bill'}
                  </div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 font-mono text-sm">
                    {formatCurrency(payment.amount)}
                  </span>
                  <Link
                    to={`/customer/receipt/${payment._id}`}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-sky-600"
                    title="View Receipt"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutData && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          orderDetails={checkoutData}
          onSuccess={() => fetchDashboardData()}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
