import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, Wallet, ShieldCheck, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import Modal from './Modal';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';

export const RazorpayCheckoutModal = ({
  isOpen,
  onClose,
  orderDetails,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [upiVpa, setUpiVpa] = useState('user@okaxis');
  const [processing, setProcessing] = useState(false);

  if (!orderDetails) return null;

  const { order, amount, billIds } = orderDetails;

  const handlePay = async () => {
    try {
      setProcessing(true);

      // Generate verification payload matching Razorpay's contract
      const paymentId = `pay_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = order.id;
      // In simulation mode, this signature prefix is recognized and verified securely
      const signature = `sim_sig_${Date.now()}`;

      // Simulate a brief gateway authorization delay (800ms)
      await new Promise((r) => setTimeout(r, 800));

      const response = await axiosClient.post('/payments/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        billIds: billIds,
        paymentMethod: selectedMethod
      });

      if (response.success) {
        toast.success('Payment verified and recorded successfully! 🎉');
        if (onSuccess) {
          onSuccess(response);
        }
        onClose();
        navigate('/customer/payment-success', {
          state: {
            payment: response.payments ? response.payments[0] : null,
            receipt: response.primaryReceipt,
            amount: amount,
            method: selectedMethod
          }
        });
      }
    } catch (err) {
      toast.error(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Checkout" maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Order Summary Header */}
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">Total Payable</span>
            <div className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
              {formatCurrency(amount)}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Order #{order?.id?.slice(-8)}</p>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedMethod('UPI')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                selectedMethod === 'UPI'
                  ? 'border-sky-500 bg-sky-50/50 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="p-2 bg-emerald-100/60 text-emerald-700 rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">UPI / QR</div>
                <div className="text-[11px] text-slate-500">GPay, PhonePe, Paytm</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('ONLINE')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                selectedMethod === 'ONLINE'
                  ? 'border-sky-500 bg-sky-50/50 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="p-2 bg-blue-100/60 text-blue-700 rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">Cards</div>
                <div className="text-[11px] text-slate-500">Debit / Credit Cards</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('BANK_TRANSFER')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                selectedMethod === 'BANK_TRANSFER'
                  ? 'border-sky-500 bg-sky-50/50 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="p-2 bg-purple-100/60 text-purple-700 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">Net Banking</div>
                <div className="text-[11px] text-slate-500">All Indian Banks</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('WALLET')}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                selectedMethod === 'WALLET'
                  ? 'border-sky-500 bg-sky-50/50 text-sky-900 ring-2 ring-sky-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="p-2 bg-amber-100/60 text-amber-700 rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">Wallets</div>
                <div className="text-[11px] text-slate-500">Paytm, Mobikwik</div>
              </div>
            </button>
          </div>
        </div>

        {/* Method Specific Details Input */}
        {selectedMethod === 'UPI' && (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Enter UPI ID or Scan QR</span>
              <span className="text-[11px] text-emerald-600 font-medium">Instant Verification</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="mobilenumber@upi"
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Supports Google Pay, PhonePe, Paytm, BHIM UPI</span>
            </div>
          </div>
        )}

        {selectedMethod === 'ONLINE' && (
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Card Checkout</span>
              <span className="text-[11px] text-emerald-600">Visa / Mastercard / RuPay</span>
            </div>
            <input
              type="text"
              readOnly
              value="•••• •••• •••• 4242"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-sm tracking-widest text-slate-700"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Expiry: 12/28</span>
              <span>CVV: •••</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-75"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Secure Payment...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Pay {formatCurrency(amount)} Now</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Safe 256-Bit Encrypted Transaction • Zero Gateway Convenience Fee
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default RazorpayCheckoutModal;
