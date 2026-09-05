import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, ArrowRight, Home, Receipt, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export const CustomerPaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customer } = useAuth();

  const paymentState = location.state || {};
  const payment = paymentState.payment || {};
  const receipt = paymentState.receipt || {};
  const amount = paymentState.amount || payment.amount || 699;
  const method = paymentState.method || payment.paymentMethod || 'UPI';

  const paymentId = payment.gatewayPaymentId || payment.transactionId || `PAY-${Date.now()}`;
  const receiptId = receipt._id || receipt.receiptNumber || payment._id || 'latest';

  return (
    <div className="max-w-lg mx-auto py-10 px-4 text-center space-y-6">
      {/* Animated Success Seal */}
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified & Settled
        </span>
        <h1 className="text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
          🎉 Payment Successful
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your payment has been cryptographically confirmed and updated on the operator's ledger.
        </p>
      </div>

      {/* Confirmation Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 text-left space-y-4">
        <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Amount Paid</span>
          <span className="text-3xl font-black text-emerald-600 font-mono font-['Plus_Jakarta_Sans']">
            {formatCurrency(amount)}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer Name</span>
            <span className="font-bold text-slate-800">{customer?.name || 'Valued Customer'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Connection ID</span>
            <span className="font-mono font-bold text-slate-800">{customer?.connectionId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Payment ID / Ref</span>
            <span className="font-mono font-semibold text-slate-700 truncate max-w-[200px]">{paymentId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Payment Date</span>
            <span className="font-semibold text-slate-800">{formatDate(new Date(), 'long')}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Payment Method</span>
            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">{method}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Link
          to={`/customer/receipt/${receiptId}`}
          className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Receipt className="w-4 h-4" />
          <span>View & Download Official Receipt</span>
        </Link>

        <Link
          to="/customer/dashboard"
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default CustomerPaymentSuccess;
