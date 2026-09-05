import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Wifi,
  Receipt,
  Clock,
  AlertOctagon,
  CreditCard,
  ArrowUpRight,
  Plus,
  Coins,
  FileText,
  Loader2,
  TrendingUp
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import axiosClient from '../../api/axiosClient';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/reports/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recentPayments = data?.recentPayments || [];
  const recentPendingBills = data?.recentPendingBills || [];

  return (
    <div className="space-y-7 pb-10">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Billing & Collections Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time subscriber metrics, provider distributions, and revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/bills"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Generate Monthly Bills</span>
          </Link>
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Customers"
          value={metrics.totalCustomers || 0}
          subtitle="Registered accounts"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Lines"
          value={metrics.activeConnections || 0}
          subtitle="Connected ONT/Cable"
          icon={Wifi}
          color="emerald"
        />
        <StatCard
          title="Monthly Billing"
          value={formatCurrency(metrics.totalMonthlyBilling || 0)}
          subtitle="Active monthly runrate"
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Collected"
          value={formatCurrency(metrics.collectedAmount || 0)}
          subtitle="Settled revenue"
          icon={CreditCard}
          color="emerald"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(metrics.pendingAmount || 0)}
          subtitle={`${metrics.pendingBillsCount || 0} unpaid invoices`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(metrics.overdueAmount || 0)}
          subtitle={`${metrics.overdueBillsCount || 0} past due date`}
          icon={AlertOctagon}
          color="rose"
        />
      </div>

      {/* Charts Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Monthly Revenue Trend (Billed vs Collected)
              </h3>
              <p className="text-xs text-slate-400">Past 6 months billing performance</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Live Audited
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(val) => [formatCurrency(val), '']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="billed"
                  name="Total Billed"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBilled)"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  name="Collected"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Paid vs Pending Donut */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Paid vs Pending Status
            </h3>
            <p className="text-xs text-slate-400">Total invoice collection ratio</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.paidVsPending || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {(charts.paidVsPending || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [formatCurrency(val), 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {(charts.paidVsPending || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name} ({item.count})
                </span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Daily Collections (Past 7 Days) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Daily Collections by Mode
              </h3>
              <p className="text-xs text-slate-400">Cash, UPI & Online transactions</p>
            </div>
            <Link to="/admin/collections" className="text-xs font-bold text-sky-600 hover:underline">
              View Ledger →
            </Link>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyCollections || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(val) => [formatCurrency(val), '']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="upi" name="UPI" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cash" name="Cash" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="online" name="Card/Net" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Provider-wise Customers & Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                Provider-wise Customer Distribution
              </h3>
              <p className="text-xs text-slate-400">BSNL, RailWire & GTPL subscribers</p>
            </div>
            <Link to="/admin/providers" className="text-xs font-bold text-sky-600 hover:underline">
              Providers →
            </Link>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.providerStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(val, name) => [name === 'revenue' ? formatCurrency(val) : val, name]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="customers" name="Customers" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Payments & Pending Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Recent Payments Recorded
            </h3>
            <Link to="/admin/payments" className="text-xs font-bold text-sky-600 hover:underline">
              All Payments →
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No payment logs yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentPayments.map((p) => (
                <div key={p._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{p.customerId?.name || 'Customer'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {p.customerId?.connectionId} • {formatDate(p.paymentDate)} • {p.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-600 block">{formatCurrency(p.amount)}</span>
                    <span className="text-[10px] text-slate-400">{p.billId?.billingMonthName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable Pending Bills */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Priority Pending / Overdue Bills
            </h3>
            <Link to="/admin/pending-bills" className="text-xs font-bold text-sky-600 hover:underline">
              View All Dues →
            </Link>
          </div>

          {recentPendingBills.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No overdue bills pending! 🎉</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentPendingBills.map((b) => (
                <div key={b._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{b.customerId?.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {b.providerId?.name} • Due: {formatDate(b.dueDate)}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-600">
                      {formatCurrency(b.remainingAmount || b.totalAmount)}
                    </span>
                    <StatusBadge status={b.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
