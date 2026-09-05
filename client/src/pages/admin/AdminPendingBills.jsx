import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertOctagon, MessageSquare, CreditCard, Search, Loader2, Download } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminPendingBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Reminder Modal
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderCustomer, setReminderCustomer] = useState(null);
  const [reminderResult, setReminderResult] = useState(null);

  // Cash modal
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [selectedBillForCash, setSelectedBillForCash] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashMethod, setCashMethod] = useState('CASH');
  const [cashNotes, setCashNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/bills/pending');
      if (res.success) {
        setBills(res.bills || []);
      }
    } catch (err) {
      toast.error('Failed to load pending dues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBills();
  }, []);

  const openReminder = async (bill) => {
    try {
      const cust = bill.customerId;
      const res = await axiosClient.post('/notifications/send-reminder', {
        billId: bill._id
      });
      if (res.success) {
        setReminderCustomer(cust);
        setReminderResult(res);
        setReminderModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to generate reminder.');
    }
  };

  const openCash = (bill) => {
    setSelectedBillForCash(bill);
    setCashAmount(bill.remainingAmount || bill.totalAmount);
    setCashModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedBillForCash) return;
    try {
      setSubmitting(true);
      const res = await axiosClient.post('/payments/record-cash', {
        billId: selectedBillForCash._id,
        customerId: selectedBillForCash.customerId?._id || selectedBillForCash.customerId,
        amount: Number(cashAmount),
        paymentMethod: cashMethod,
        notes: cashNotes
      });
      if (res.success) {
        toast.success(`Payment of ${formatCurrency(cashAmount)} recorded!`);
        setCashModalOpen(false);
        fetchPendingBills();
      }
    } catch (err) {
      toast.error(err.message || 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = bills.filter(
    (b) =>
      !search ||
      (b.customerId?.name && b.customerId.name.toLowerCase().includes(search.toLowerCase())) ||
      (b.customerId?.connectionId && b.customerId.connectionId.toLowerCase().includes(search.toLowerCase())) ||
      (b.billNumber && b.billNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOutstanding = filtered.reduce((acc, b) => acc + (b.remainingAmount || b.totalAmount), 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Pending & Overdue Collections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Focus list of unpaid subscriber accounts, dues reminders, and counter collections.
          </p>
        </div>

        <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Unpaid Dues</span>
          <span className="text-xl font-black text-rose-600 font-mono">
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriber, connection ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> overdue / pending bills
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Pending Bills 🎉</h3>
          <p className="text-xs text-slate-500 mt-1">All subscriber accounts are fully cleared.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Subscriber</th>
                  <th className="px-5 py-3.5">Connection ID</th>
                  <th className="px-5 py-3.5">Bill Number & Month</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Pending Balance</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/customers/${b.customerId?._id}`}
                        className="font-bold text-slate-900 hover:text-sky-600 block"
                      >
                        {b.customerId?.name || 'Customer'}
                      </Link>
                      <span className="text-slate-400 font-mono text-[11px]">+91 {b.customerId?.phone}</span>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      {b.customerId?.connectionId}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{b.billingMonthName}</div>
                      <span className="text-slate-400 font-mono text-[11px]">{b.billNumber}</span>
                    </td>

                    <td className="px-5 py-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {formatDate(b.dueDate)}
                    </td>

                    <td className="px-5 py-4 font-mono font-black text-rose-600 text-sm">
                      {formatCurrency(b.remainingAmount || b.totalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} size="xs" />
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openReminder(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition-colors"
                          title="Dispatch Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Remind</span>
                        </button>

                        <button
                          onClick={() => openCash(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors"
                          title="Record Cash Collection"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      <Modal isOpen={reminderModalOpen} onClose={() => setReminderModalOpen(false)} title="Payment Reminder" maxWidth="max-w-md">
        {reminderResult && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">{reminderCustomer?.name} (+91 {reminderCustomer?.phone})</span>
            </div>
            <p className="p-3 bg-slate-100 rounded-xl text-slate-700 leading-relaxed font-mono select-all">
              {reminderResult.messageText}
            </p>
            <div className="space-y-2 pt-2">
              <a
                href={reminderResult.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span>Send via WhatsApp</span>
              </a>
              <a
                href={reminderResult.smsLink}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span>Send via SMS</span>
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Cash Modal */}
      <Modal isOpen={cashModalOpen} onClose={() => setCashModalOpen(false)} title="Collect Bill Payment" maxWidth="max-w-md">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900">{selectedBillForCash?.customerId?.name}</div>
            <div className="text-slate-500 font-mono">
              Bill #{selectedBillForCash?.billNumber} • Balance: {formatCurrency(selectedBillForCash?.remainingAmount || selectedBillForCash?.totalAmount)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Amount Collected (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Payment Mode *</label>
              <select
                value={cashMethod}
                onChange={(e) => setCashMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              >
                <option value="CASH">Cash (Counter)</option>
                <option value="UPI">UPI Direct (QR / PhonePe)</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="ONLINE">POS Card Swipe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Notes</label>
            <input
              type="text"
              value={cashNotes}
              onChange={(e) => setCashNotes(e.target.value)}
              placeholder="Collected at counter"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Collection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPendingBills;
