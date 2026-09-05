import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CreditCard, ShieldCheck, CheckCircle2, Calendar, AlertCircle, Loader2, ArrowLeft, Download } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import RazorpayCheckoutModal from '../../components/common/RazorpayCheckoutModal';
import { formatCurrency, formatDate, getProviderBadge } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const CustomerCurrentBill = () => {
  const { customer } = useAuth();
  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [checkoutData, setCheckoutData] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchBill = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/bills');
      if (res.success && res.bills && res.bills.length > 0) {
        const latest = res.bills[0];
        setBill(latest);

        // Fetch payments for this bill if paid
        const pRes = await axiosClient.get(`/payments?limit=10`);
        if (pRes.success) {
          const matchingPayments = (pRes.payments || []).filter(
            (p) => p.billId?._id === latest._id || p.billId === latest._id
          );
          setPayments(matchingPayments);
        }
      }
    } catch (err) {
      toast.error('Failed to load bill details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, []);

  const handlePay = async () => {
    if (!bill) return;
    try {
      const res = await axiosClient.post('/payments/create-order', {
        billIds: [bill._id]
      });
      if (res.success) {
        setCheckoutData(res);
        setIsCheckoutOpen(true);
      }
    } catch (err) {
      toast.error(err.message || 'Order creation failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Current Bill Available</h3>
        <p className="text-xs text-slate-500 mt-1">There are no generated invoices for your connection at this time.</p>
        <Link to="/customer/dashboard" className="mt-4 inline-block text-xs font-bold text-sky-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isPaid = bill.status === 'PAID';
  const providerBadge = getProviderBadge(bill.providerId);
  const totalPayable = bill.remainingAmount > 0 ? bill.remainingAmount : bill.totalAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Top breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <StatusBadge status={bill.status} size="lg" />
      </div>

      {/* Main Itemized Bill Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        {/* Bill Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-7 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-400">
              Tax Invoice Statement
            </span>
            <h1 className="text-2xl font-black font-['Plus_Jakarta_Sans'] mt-0.5">
              {bill.billingMonthName} Bill
            </h1>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Invoice #{bill.billNumber}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block">Payment Due Date</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {formatDate(bill.dueDate, 'long')}
            </span>
          </div>
        </div>

        {/* Subscriber & Connection Metadata */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Customer Name</span>
            <span className="font-bold text-slate-800">{customer?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Connection ID</span>
            <span className="font-mono font-bold text-slate-800">{customer?.connectionId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Provider</span>
            <span className="font-bold text-sky-700">{customer?.provider?.name || 'Broadband'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Plan & Speed</span>
            <span className="font-bold text-slate-800">{customer?.plan?.name || '100 Mbps'}</span>
          </div>
        </div>

        {/* Bill Line Items */}
        <div className="p-6 sm:p-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Bill Calculation Breakdown
          </h3>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Current Monthly Bill (Base Plan)</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(bill.baseAmount)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Previous Pending Dues</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(bill.previousPending || 0)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Late Payment Fee</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(bill.lateFee || 0)}</span>
            </div>

            {bill.discount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100 text-emerald-600">
                <span>Discount / Promo</span>
                <span className="font-mono font-semibold">-{formatCurrency(bill.discount)}</span>
              </div>
            )}

            {bill.paidAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-100 text-emerald-700 font-medium">
                <span>Amount Paid So Far</span>
                <span className="font-mono font-bold">-{formatCurrency(bill.paidAmount)}</span>
              </div>
            )}

            {/* Total Payable Row */}
            <div className="flex justify-between items-baseline pt-3 text-base">
              <span className="font-bold text-slate-900">Total Payable Amount</span>
              <span className="text-2xl font-black text-sky-600 font-mono font-['Plus_Jakarta_Sans']">
                {formatCurrency(totalPayable)}
              </span>
            </div>
          </div>

          {/* Action / Payment Status Area */}
          <div className="pt-6">
            {isPaid ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-base">PAID ✓</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Payment Date</span>
                    <span className="font-semibold">{payments[0] ? formatDate(payments[0].paymentDate) : 'Settled'}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Transaction ID</span>
                    <span className="font-mono font-semibold truncate block">{payments[0]?.transactionId || 'TXN-ONLINE'}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px]">Payment Method</span>
                    <span className="font-semibold">{payments[0]?.paymentMethod || 'UPI / ONLINE'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/customer/receipt/${bill._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Digital Receipt (PDF)
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handlePay}
                  className="w-full py-4 px-6 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-black text-lg rounded-2xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer font-['Plus_Jakarta_Sans']"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>PAY NOW • {formatCurrency(totalPayable)}</span>
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Instant activation upon successful payment verification. Powered by Razorpay.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutData && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          orderDetails={checkoutData}
          onSuccess={() => fetchBill()}
        />
      )}
    </div>
  );
};

export default CustomerCurrentBill;
