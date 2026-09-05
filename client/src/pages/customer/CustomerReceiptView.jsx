import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Printer, ArrowLeft, Wifi, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { downloadReceiptPdf } from '../../utils/pdfGenerator';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const CustomerReceiptView = () => {
  const { id } = useParams();
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`/payments/receipt/${id}`);
        if (res.success) {
          setReceiptData(res);
        }
      } catch (err) {
        toast.error('Failed to load receipt.');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadReceiptPdf('printable-receipt', `Receipt_${receiptData?.receipt?.receiptNumber || 'Invoice'}.pdf`);
      toast.success('Receipt downloaded successfully.');
    } catch (e) {
      toast.error('PDF generation failed. Printing receipt instead...');
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!receiptData || !receiptData.receipt) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Receipt Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">Could not find an issued receipt matching this reference.</p>
        <Link to="/customer/dashboard" className="mt-4 inline-block text-xs font-bold text-sky-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { receipt, business } = receiptData;
  const payment = receipt.paymentId || {};
  const bill = receipt.billId || {};
  const customer = receipt.customerId || {};
  const provider = bill.providerId || customer.providerId || {};
  const plan = customer.planId || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Bar with Actions */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting PDF...' : 'Download PDF Receipt'}</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Canvas */}
      <div
        id="printable-receipt"
        className="bg-white rounded-3xl border border-slate-300/80 shadow-xl p-8 sm:p-10 space-y-7 relative text-slate-800"
      >
        {/* Paid Stamp Watermark */}
        <div className="absolute top-8 right-8 rotate-[-15deg] border-4 border-emerald-600/30 text-emerald-600 font-black text-2xl tracking-widest px-4 py-1.5 rounded-xl select-none pointer-events-none uppercase">
          PAID ✓
        </div>

        {/* Header: Company Information */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                <Wifi className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
                Connect<span className="text-sky-600">Bill</span>
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-800 pt-1">
              {business.businessName || 'ConnectBill Cable & Internet Services'}
            </h2>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              {business.businessAddress || '124 Telecom Lane, Main Market, Tech City'}
            </p>
            <p className="text-[11px] text-slate-500">
              Helpline: {business.phone || '+91 98765 43210'} • {business.email || 'support@connectbill.com'}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 pt-1">
            <span className="text-xs uppercase tracking-wider font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md inline-block">
              Payment Receipt
            </span>
            <div className="text-xs font-mono font-bold text-slate-900 pt-1">
              Receipt #{receipt.receiptNumber}
            </div>
            <div className="text-[11px] text-slate-500">
              Payment Date: {formatDate(receipt.receiptDate || payment.paymentDate, 'long')}
            </div>
          </div>
        </div>

        {/* Customer & Connection Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Subscriber Name</span>
            <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
            <span className="block text-slate-500 text-[11px] font-mono mt-0.5">+91 {customer.phone}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Connection Identifier</span>
            <span className="font-mono font-black text-sky-700 text-sm">{customer.connectionId}</span>
            <span className="block text-slate-500 text-[11px] mt-0.5">Network: {provider.name || 'Broadband'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Assigned Subscription</span>
            <span className="font-bold text-slate-900">{plan.name || 'High Speed Plan'}</span>
            <span className="block text-slate-500 text-[11px] mt-0.5">Speed: {plan.speed || '100 Mbps'}</span>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 text-left">Description</th>
                <th className="py-2.5 text-center">Invoice Ref</th>
                <th className="py-2.5 text-center">Billing Month</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 font-semibold text-slate-900">
                  Monthly Internet / Cable Subscription
                  <span className="block text-[11px] font-normal text-slate-500">
                    Unlimited fiber data and digital service charge
                  </span>
                </td>
                <td className="py-3 text-center font-mono text-slate-600">
                  {bill.billNumber || 'CB-INV'}
                </td>
                <td className="py-3 text-center font-semibold text-slate-700">
                  {bill.billingMonthName || 'Monthly'}
                </td>
                <td className="py-3 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(payment.amount || bill.totalAmount)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800">
                <td colSpan={3} className="py-3 text-right font-bold text-slate-700 text-sm">
                  Total Paid:
                </td>
                <td className="py-3 text-right font-mono font-black text-lg text-emerald-600">
                  {formatCurrency(payment.amount || bill.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Transaction Proof Details */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-emerald-800 text-[10px] uppercase font-bold block">Payment Gateway</span>
            <span className="font-semibold text-slate-800">{payment.gateway || 'RAZORPAY'}</span>
          </div>
          <div>
            <span className="text-emerald-800 text-[10px] uppercase font-bold block">Transaction / Payment ID</span>
            <span className="font-mono font-bold text-slate-800 truncate block">
              {payment.transactionId || payment.gatewayPaymentId || 'TXN-CONFIRMED'}
            </span>
          </div>
          <div>
            <span className="text-emerald-800 text-[10px] uppercase font-bold block">Mode of Payment</span>
            <span className="font-semibold text-slate-800">{payment.paymentMethod || 'UPI / ONLINE'}</span>
          </div>
        </div>

        {/* Footer Terms & Digital Signature */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2">
          <p>This is an electronically generated receipt. No physical signature is required.</p>
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ConnectBill Secure Billing System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReceiptView;
