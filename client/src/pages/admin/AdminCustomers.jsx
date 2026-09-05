import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  Phone,
  Wifi,
  MoreVertical,
  MessageSquare,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate, getProviderBadge } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [billingStatus, setBillingStatus] = useState('ALL');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    area: 'Main Sector',
    providerId: '',
    connectionId: '',
    planId: '',
    monthlyAmount: '',
    dueDay: 10,
    notes: ''
  });

  // Record Cash Payment Modal
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [selectedCustomerForCash, setSelectedCustomerForCash] = useState(null);
  const [cashBillId, setCashBillId] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashMethod, setCashMethod] = useState('CASH');
  const [cashNotes, setCashNotes] = useState('');
  const [customerBills, setCustomerBills] = useState([]);

  // Send Reminder Modal
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderCustomer, setReminderCustomer] = useState(null);
  const [reminderResult, setReminderResult] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (selectedProvider !== 'ALL') query.append('providerId', selectedProvider);
      if (selectedStatus !== 'ALL') query.append('status', selectedStatus);
      if (billingStatus !== 'ALL') query.append('billingStatus', billingStatus);

      const [custRes, provRes, plansRes] = await Promise.all([
        axiosClient.get(`/customers?${query.toString()}`),
        axiosClient.get('/providers'),
        axiosClient.get('/plans')
      ]);

      if (custRes.success) setCustomers(custRes.customers || []);
      if (provRes.success) setProviders(provRes.providers || []);
      if (plansRes.success) setPlans(plansRes.plans || []);
    } catch (err) {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [selectedProvider, selectedStatus, billingStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle plan selection in add modal to autofill monthly amount and connection ID prefix
  const handleProviderChangeInAdd = (pId) => {
    const selectedP = providers.find((p) => p._id === pId);
    const code = selectedP ? selectedP.code : 'RW';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setNewCustomer((prev) => ({
      ...prev,
      providerId: pId,
      connectionId: `${code}${randNum}`
    }));
  };

  const handlePlanChangeInAdd = (planId) => {
    const selectedPlan = plans.find((p) => p._id === planId);
    setNewCustomer((prev) => ({
      ...prev,
      planId,
      monthlyAmount: selectedPlan ? selectedPlan.monthlyPrice : ''
    }));
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await axiosClient.post('/customers', newCustomer);
      if (res.success) {
        toast.success('Customer registered successfully!');
        setIsAddModalOpen(false);
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
          area: 'Main Sector',
          providerId: '',
          connectionId: '',
          planId: '',
          monthlyAmount: '',
          dueDay: 10,
          notes: ''
        });
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create customer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Cash Modal
  const openCashModal = async (cust) => {
    setSelectedCustomerForCash(cust);
    try {
      const res = await axiosClient.get(`/bills?customerId=${cust._id}&status=PENDING`);
      const pendingBills = res.bills || [];
      setCustomerBills(pendingBills);
      if (pendingBills.length > 0) {
        setCashBillId(pendingBills[0]._id);
        setCashAmount(pendingBills[0].remainingAmount || pendingBills[0].totalAmount);
      } else {
        setCashBillId('');
        setCashAmount(cust.monthlyAmount || '');
      }
      setCashModalOpen(true);
    } catch (err) {
      toast.error('Failed to load pending bills for customer.');
    }
  };

  const handleRecordCash = async (e) => {
    e.preventDefault();
    if (!cashBillId) {
      toast.error('No pending bill selected to settle.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosClient.post('/payments/record-cash', {
        billId: cashBillId,
        customerId: selectedCustomerForCash._id,
        amount: Number(cashAmount),
        paymentMethod: cashMethod,
        notes: cashNotes
      });
      if (res.success) {
        toast.success(`Payment of ${formatCurrency(cashAmount)} recorded! Status: ${res.bill?.status}`);
        setCashModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record cash payment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reminder Modal
  const openReminderModal = async (cust) => {
    try {
      const res = await axiosClient.get(`/bills?customerId=${cust._id}&status=PENDING`);
      const pending = res.bills || [];
      if (pending.length === 0) {
        toast('Customer has no pending dues.', { icon: '🎉' });
        return;
      }
      const reminderRes = await axiosClient.post('/notifications/send-reminder', {
        billId: pending[0]._id
      });
      if (reminderRes.success) {
        setReminderCustomer(cust);
        setReminderResult(reminderRes);
        setReminderModalOpen(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to generate reminder.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage subscriber records, lines, provider connections, dues, and payment reminders.
          </p>
        </div>

        <button
          onClick={() => {
            if (providers.length > 0) {
              handleProviderChangeInAdd(providers[0]._id);
            }
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, connection ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Providers</option>
            {providers.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Billing Dues Filter */}
          <select
            value={billingStatus}
            onChange={(e) => setBillingStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Billing States</option>
            <option value="PENDING">With Pending Dues</option>
            <option value="PAID">All Paid Up</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive / Disconnected</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Customers Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new customer.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Customer / Mobile</th>
                  <th className="px-5 py-3.5">Connection ID</th>
                  <th className="px-5 py-3.5">Provider & Plan</th>
                  <th className="px-5 py-3.5">Monthly</th>
                  <th className="px-5 py-3.5">Pending Dues</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const pBadge = getProviderBadge(c.providerId);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Phone */}
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/admin/customers/${c._id}`}
                          className="font-bold text-slate-900 hover:text-sky-600 block"
                        >
                          {c.name}
                        </Link>
                        <span className="text-slate-500 font-mono text-[11px]">+91 {c.phone}</span>
                      </td>

                      {/* Connection ID */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {c.connectionId}
                        </span>
                      </td>

                      {/* Provider & Plan */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-md border ${pBadge.bg} ${pBadge.textColor}`}>
                          {c.providerId?.name || 'BSNL'}
                        </span>
                        <div className="text-slate-600 font-medium text-[11px] truncate max-w-[150px] mt-0.5">
                          {c.planId?.name || 'Standard'} ({c.planId?.speed || '100 Mbps'})
                        </div>
                      </td>

                      {/* Monthly Plan Price */}
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {formatCurrency(c.monthlyAmount)}
                      </td>

                      {/* Pending Dues */}
                      <td className="px-5 py-3.5 font-mono">
                        {c.totalPending > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                            {formatCurrency(c.totalPending)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={c.status} size="xs" />
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Record Cash Payment */}
                          <button
                            onClick={() => openCashModal(c)}
                            title="Record Cash Payment"
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Send Reminder */}
                          <button
                            onClick={() => openReminderModal(c)}
                            title="Send Payment Reminder"
                            className="p-1.5 rounded-lg border border-slate-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* View Detail */}
                          <Link
                            to={`/admin/customers/${c._id}`}
                            title="View Full Profile"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Register New Customer */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer & Connection" maxWidth="max-w-xl">
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Full Name *</label>
              <input
                type="text"
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Ravi Kumar"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Mobile Number *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="9000000001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Provider *</label>
              <select
                required
                value={newCustomer.providerId}
                onChange={(e) => handleProviderChangeInAdd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
              >
                <option value="">Select ISP Provider</option>
                {providers.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Connection ID *</label>
              <input
                type="text"
                required
                value={newCustomer.connectionId}
                onChange={(e) => setNewCustomer({ ...newCustomer, connectionId: e.target.value.toUpperCase() })}
                placeholder="BSNL1001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Plan Package *</label>
              <select
                required
                value={newCustomer.planId}
                onChange={(e) => handlePlanChangeInAdd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
              >
                <option value="">Select Subscription Plan</option>
                {plans
                  .filter((p) => !newCustomer.providerId || p.providerId?._id === newCustomer.providerId || p.providerId === newCustomer.providerId)
                  .map((p) => (
                    <option key={p._id} value={p._id}>{p.name} - ₹{p.monthlyPrice} ({p.speed})</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Monthly Amount (₹) *</label>
              <input
                type="number"
                required
                value={newCustomer.monthlyAmount}
                onChange={(e) => setNewCustomer({ ...newCustomer, monthlyAmount: e.target.value })}
                placeholder="699"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Area / Colony</label>
              <input
                type="text"
                value={newCustomer.area}
                onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })}
                placeholder="Sector 4 / Market Area"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Default Due Day</label>
              <input
                type="number"
                min={1}
                max={31}
                value={newCustomer.dueDay}
                onChange={(e) => setNewCustomer({ ...newCustomer, dueDay: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Installation Full Address *</label>
            <input
              type="text"
              required
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              placeholder="Flat 302, Green Valley Apartments"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Customer & Active Line'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Record Manual Cash / Counter Payment */}
      <Modal isOpen={cashModalOpen} onClose={() => setCashModalOpen(false)} title="Record Manual / Cash Payment" maxWidth="max-w-md">
        <form onSubmit={handleRecordCash} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">{selectedCustomerForCash?.name}</div>
            <div className="text-slate-500 font-mono">
              Conn ID: {selectedCustomerForCash?.connectionId} • Mobile: +91 {selectedCustomerForCash?.phone}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Select Bill to Settle *</label>
            {customerBills.length === 0 ? (
              <p className="text-amber-600 font-semibold py-1">No pending bills found for this customer.</p>
            ) : (
              <select
                required
                value={cashBillId}
                onChange={(e) => {
                  setCashBillId(e.target.value);
                  const b = customerBills.find((bill) => bill._id === e.target.value);
                  if (b) setCashAmount(b.remainingAmount || b.totalAmount);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
              >
                {customerBills.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.billingMonthName} - Dues: ₹{b.remainingAmount} (Total: ₹{b.totalAmount})
                  </option>
                ))}
              </select>
            )}
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
                placeholder="699"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Payment Mode *</label>
              <select
                value={cashMethod}
                onChange={(e) => setCashMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs"
              >
                <option value="CASH">Cash (Counter)</option>
                <option value="UPI">UPI Direct (QR/PhonePe)</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="ONLINE">POS Card Swipe</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Notes / Handed To</label>
            <input
              type="text"
              value={cashNotes}
              onChange={(e) => setCashNotes(e.target.value)}
              placeholder="Collected by operator / line technician"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !cashBillId}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment & Issue Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Payment Reminder Dispatch */}
      <Modal isOpen={reminderModalOpen} onClose={() => setReminderModalOpen(false)} title="Send Payment Reminder" maxWidth="max-w-md">
        {reminderResult && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Recipient</span>
              <span className="font-bold text-slate-800">{reminderCustomer?.name} (+91 {reminderCustomer?.phone})</span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Generated Message</span>
              <p className="p-3 bg-slate-100 rounded-xl text-slate-700 leading-relaxed text-[11px] font-mono select-all">
                {reminderResult.messageText}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <a
                href={reminderResult.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp</span>
              </a>

              <a
                href={reminderResult.smsLink}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Send SMS Direct</span>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomers;
