import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertOctagon, CheckCircle2, CreditCard, ArrowLeft, Loader2, CheckSquare, Square } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import RazorpayCheckoutModal from '../../components/common/RazorpayCheckoutModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const CustomerPendingBills = () => {
  const [bills, setBills] = useState([]);
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [checkoutData, setCheckoutData] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/bills/pending');
      if (res.success) {
        const pending = res.bills || [];
        setBills(pending);
        // By default select all pending bills
        setSelectedBillIds(pending.map((b) => b._id));
      }
    } catch (err) {
      toast.error('Failed to load pending bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBills();
  }, []);

  const toggleSelectBill = (id) => {
    setSelectedBillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedBillIds.length === bills.length) {
      setSelectedBillIds([]);
    } else {
      setSelectedBillIds(bills.map((b) => b._id));
    }
  };

  const selectedBills = bills.filter((b) => selectedBillIds.includes(b._id));
  const totalPayable = selectedBills.reduce((acc, b) => acc + (b.remainingAmount || b.totalAmount), 0);
  const allPendingTotal = bills.reduce((acc, b) => acc + (b.remainingAmount || b.totalAmount), 0);

  const handlePaySelected = async () => {
    if (selectedBillIds.length === 0) {
      toast.error('Please select at least one bill to pay.');
      return;
    }

    try {
      const res = await axiosClient.post('/payments/create-order', {
        billIds: selectedBillIds
      });
      if (res.success) {
        setCheckoutData(res);
        setIsCheckoutOpen(true);
      }
    } catch (err) {
      toast.error(err.message || 'Payment initiation failed.');
    }
  };

  const handlePaySingle = async (billId) => {
    try {
      const res = await axiosClient.post('/payments/create-order', {
        billIds: [billId]
      });
      if (res.success) {
        setCheckoutData(res);
        setIsCheckoutOpen(true);
      }
    } catch (err) {
      toast.error(err.message || 'Payment initiation failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

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
        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          {bills.length} Outstanding Bill{bills.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
          Pending & Overdue Bills
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Select unpaid bills to pay individually or clear all dues in one single checkout.
        </p>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Pending Bills 🎉</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You're completely up to date! All previous internet and cable monthly dues are settled.
          </p>
          <Link
            to="/customer/dashboard"
            className="mt-5 inline-block px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl"
          >
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* Select All Bar */}
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-2 hover:text-sky-600"
            >
              {selectedBillIds.length === bills.length ? (
                <CheckSquare className="w-4 h-4 text-sky-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedBillIds.length === bills.length ? 'Deselect All' : 'Select All Bills'}
              </span>
            </button>
            <span>Total Pending: {formatCurrency(allPendingTotal)}</span>
          </div>

          {/* Pending Bills List */}
          <div className="space-y-3.5">
            {bills.map((b) => {
              const isSelected = selectedBillIds.includes(b._id);
              const isOverdue = b.status === 'OVERDUE' || (new Date(b.dueDate) < new Date() && b.status !== 'PAID');
              const amount = b.remainingAmount > 0 ? b.remainingAmount : b.totalAmount;

              return (
                <div
                  key={b._id}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                    isSelected ? 'border-sky-500 ring-2 ring-sky-500/10' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectBill(b._id)}
                        className="mt-0.5 text-slate-400 hover:text-sky-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-sky-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                            {b.billingMonthName}
                          </h3>
                          <StatusBadge status={isOverdue ? 'OVERDUE' : b.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Due Date: <strong className={isOverdue ? 'text-rose-600' : 'text-slate-700'}>{formatDate(b.dueDate)}</strong> • Bill #{b.billNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {formatCurrency(amount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePaySingle(b._id)}
                        className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1"
                      >
                        Pay Single →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Total Pending Summary & Pay All Action */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Total Amount Payable ({selectedBills.length} Bill{selectedBills.length !== 1 ? 's' : ''})
              </span>
              <div className="text-3xl font-black font-['Plus_Jakarta_Sans'] text-sky-400 font-mono">
                {formatCurrency(totalPayable)}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePaySelected}
              disabled={selectedBillIds.length === 0}
              className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-black text-base rounded-2xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              <span>Pay All Selected Bills</span>
            </button>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {checkoutData && (
        <RazorpayCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          orderDetails={checkoutData}
          onSuccess={() => fetchPendingBills()}
        />
      )}
    </div>
  );
};

export default CustomerPendingBills;
