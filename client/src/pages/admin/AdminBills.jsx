import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  Play,
  CreditCard,
  Ban,
  Download,
  Loader2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminBills = () => {
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter tabs: 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
  const [statusTab, setStatusTab] = useState('ALL');
  const [search, setSearch] = useState('');

  // Bulk Generate Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generating, setGenerating] = useState(false);

  // Manual Bill Creation Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    customerId: '',
    billingMonth: '',
    dueDate: '',
    baseAmount: '',
    previousPending: 0,
    lateFee: 0,
    discount: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Record Cash Payment Modal
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [selectedBillForCash, setSelectedBillForCash] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashMethod, setCashMethod] = useState('CASH');
  const [cashNotes, setCashNotes] = useState('');

  const fetchBillsAndCustomers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusTab !== 'ALL') query.append('status', statusTab);
      if (search) query.append('search', search);

      const [billsRes, custRes] = await Promise.all([
        axiosClient.get(`/bills?${query.toString()}`),
        axiosClient.get('/customers?status=ACTIVE')
      ]);

      if (billsRes.success) setBills(billsRes.bills || []);
      if (custRes.success) setCustomers(custRes.customers || []);
    } catch (err) {
      toast.error('Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillsAndCustomers();
  }, [statusTab]);

  useEffect(() => {
    const t = setTimeout(fetchBillsAndCustomers, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Bulk Monthly Bill Generation Trigger
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await axiosClient.post('/bills/generate-monthly', { month: genMonth });
      if (res.success) {
        toast.success(res.message);
        setGenerateModalOpen(false);
        fetchBillsAndCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  // Create Manual Bill
  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axiosClient.post('/bills', newBill);
      if (res.success) {
        toast.success('Bill generated successfully.');
        setCreateModalOpen(false);
        fetchBillsAndCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate bill.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Customer Select in Create Bill modal
  const handleCustomerSelect = (custId) => {
    const cust = customers.find((c) => c._id === custId);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const due = new Date(now.getFullYear(), now.getMonth(), cust?.dueDay || 10);

    setNewBill((prev) => ({
      ...prev,
      customerId: custId,
      billingMonth: currentMonth,
      dueDate: due.toISOString().split('T')[0],
      baseAmount: cust?.monthlyAmount || '',
      previousPending: cust?.totalPending || 0
    }));
  };

  // Cancel Bill
  const handleCancelBill = async (billId) => {
    if (!window.confirm('Are you sure you want to cancel this bill?')) return;
    try {
      const res = await axiosClient.put(`/bills/${billId}/cancel`);
      if (res.success) {
        toast.success('Bill cancelled.');
        fetchBillsAndCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel bill.');
    }
  };

  // Open Cash Modal
  const openCashModal = (bill) => {
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
        toast.success(`Payment of ${formatCurrency(cashAmount)} recorded! Status: ${res.bill?.status}`);
        setCashModalOpen(false);
        fetchBillsAndCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Payment recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Bill & Invoice Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated monthly billing, manual counter statements, and cash collection recordings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 text-sky-400" />
            <span>Auto-Generate Monthly Bills</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Bill</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto text-xs font-bold overflow-x-auto">
          {['ALL', 'PENDING', 'PAID', 'PARTIAL', 'OVERDUE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                statusTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bill #, subscriber name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Bills Found</h3>
          <p className="text-xs text-slate-500 mt-1">Generate automated monthly bills or create one manually.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Bill Number</th>
                  <th className="px-5 py-3.5">Subscriber</th>
                  <th className="px-5 py-3.5">Month</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Remaining Balance</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {b.billNumber}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800">{b.customerId?.name || 'Customer'}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{b.customerId?.connectionId}</div>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {b.billingMonthName}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {formatCurrency(b.totalAmount)}
                    </td>

                    <td className="px-5 py-4 font-mono">
                      {b.remainingAmount > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatCurrency(b.remainingAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Settled</span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(b.dueDate)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={b.status} size="xs" />
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* If not paid, allow recording cash */}
                        {b.status !== 'PAID' && b.status !== 'CANCELLED' && (
                          <button
                            onClick={() => openCashModal(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors"
                            title="Record Cash Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        )}

                        {/* View / Download Receipt */}
                        <Link
                          to={`/customer/receipt/${b._id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="View Digital Invoice"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Link>

                        {/* Cancel Draft/Unpaid Bill */}
                        {b.paidAmount === 0 && b.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelBill(b._id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Cancel Bill"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Auto-Generate Monthly Bills */}
      <Modal isOpen={generateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate Monthly Billing Cycle" maxWidth="max-w-md">
        <form onSubmit={handleBulkGenerate} className="space-y-4 text-xs">
          <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-2xl text-sky-950 space-y-1">
            <span className="font-bold block text-sm">Automated Duplicate-Safe Billing</span>
            <p className="text-[11px] text-sky-700 leading-relaxed">
              Iterates all ACTIVE customer connections. Computes base plan price, carries forward any unpaid pending balances, and generates unique invoices. Customers who already have a bill for this month will be skipped automatically.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Select Target Month (YYYY-MM) *</label>
            <input
              type="month"
              required
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Monthly Billing Generation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Manual Single Bill Creation */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Generate Individual Bill" maxWidth="max-w-md">
        <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Select Customer *</label>
            <select
              required
              value={newBill.customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs"
            >
              <option value="">Choose active customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.connectionId}) - ₹{c.monthlyAmount}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Billing Month *</label>
              <input
                type="month"
                required
                value={newBill.billingMonth}
                onChange={(e) => setNewBill({ ...newBill, billingMonth: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Due Date *</label>
              <input
                type="date"
                required
                value={newBill.dueDate}
                onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Base Amount (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={newBill.baseAmount}
                onChange={(e) => setNewBill({ ...newBill, baseAmount: e.target.value })}
                placeholder="699"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Previous Pending (₹)</label>
              <input
                type="number"
                min={0}
                value={newBill.previousPending}
                onChange={(e) => setNewBill({ ...newBill, previousPending: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create & Issue Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Record Cash Payment on specific Bill */}
      <Modal isOpen={cashModalOpen} onClose={() => setCashModalOpen(false)} title="Record Manual Payment" maxWidth="max-w-md">
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
              placeholder="Collected at shop counter"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Collection & Generate Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBills;
