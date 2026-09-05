import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar, Loader2, FileSpreadsheet, Layers, Users, CreditCard } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminReports = () => {
  const [reportType, setReportType] = useState('PROVIDER'); // 'PROVIDER' | 'COLLECTIONS' | 'PENDING' | 'CUSTOMERS'
  const [providerReport, setProviderReport] = useState([]);
  const [collectionsReport, setCollectionsReport] = useState(null);
  const [pendingReport, setPendingReport] = useState([]);
  const [customersReport, setCustomersReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (reportType === 'PROVIDER') {
        const res = await axiosClient.get('/reports/providers');
        if (res.success) setProviderReport(res.report || []);
      } else if (reportType === 'COLLECTIONS') {
        const res = await axiosClient.get('/reports/collections?period=MONTH');
        if (res.success) setCollectionsReport(res);
      } else if (reportType === 'PENDING') {
        const res = await axiosClient.get('/bills/pending');
        if (res.success) setPendingReport(res.bills || []);
      } else if (reportType === 'CUSTOMERS') {
        const res = await axiosClient.get('/customers');
        if (res.success) setCustomersReport(res.customers || []);
      }
    } catch (err) {
      toast.error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  // Export CSV Helper
  const exportCsv = () => {
    let rows = [];
    let filename = `ConnectBill_${reportType}_Report.csv`;

    if (reportType === 'PROVIDER') {
      rows.push(['Provider Name', 'Code', 'Subscribers', 'Active Lines', 'Monthly Billing', 'Collected', 'Pending']);
      providerReport.forEach((p) => {
        rows.push([p.providerName, p.code, p.customersCount, p.activeConnections, p.monthlyBilling, p.collected, p.pending]);
      });
    } else if (reportType === 'PENDING') {
      rows.push(['Bill Number', 'Customer Name', 'Phone', 'Connection ID', 'Billing Month', 'Total Amount', 'Remaining', 'Due Date', 'Status']);
      pendingReport.forEach((b) => {
        rows.push([
          b.billNumber,
          b.customerId?.name,
          b.customerId?.phone,
          b.customerId?.connectionId,
          b.billingMonthName,
          b.totalAmount,
          b.remainingAmount,
          formatDate(b.dueDate),
          b.status
        ]);
      });
    } else if (reportType === 'COLLECTIONS') {
      rows.push(['Transaction ID', 'Date', 'Customer', 'Connection ID', 'Month', 'Amount', 'Method']);
      (collectionsReport?.payments || []).forEach((p) => {
        rows.push([
          p.transactionId,
          formatDate(p.paymentDate),
          p.customerId?.name,
          p.customerId?.connectionId,
          p.billId?.billingMonthName,
          p.amount,
          p.paymentMethod
        ]);
      });
    } else if (reportType === 'CUSTOMERS') {
      rows.push(['Customer Name', 'Phone', 'Connection ID', 'Provider', 'Plan', 'Monthly Fee', 'Status', 'Pending Dues']);
      customersReport.forEach((c) => {
        rows.push([
          c.name,
          c.phone,
          c.connectionId,
          c.providerId?.name,
          c.planId?.name,
          c.monthlyAmount,
          c.status,
          c.totalPending
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully.');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Financial & Provider Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export monthly collections, provider runrates, and pending balances to CSV or printable summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'Provider Breakdown', value: 'PROVIDER', icon: Layers },
          { label: 'Pending Dues Report', value: 'PENDING', icon: Calendar },
          { label: 'Collections Ledger', value: 'COLLECTIONS', icon: CreditCard },
          { label: 'Customer Summary', value: 'CUSTOMERS', icon: Users }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              onClick={() => setReportType(item.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                reportType === item.value
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Provider Report Table */}
          {reportType === 'PROVIDER' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Provider Network</th>
                    <th className="px-5 py-3.5">Subscribers</th>
                    <th className="px-5 py-3.5">Active Connections</th>
                    <th className="px-5 py-3.5">Monthly Billing</th>
                    <th className="px-5 py-3.5">Collected Total</th>
                    <th className="px-5 py-3.5 text-right">Pending Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {providerReport.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                        {p.providerName}
                        <span className="block text-[11px] font-mono text-slate-400">({p.code})</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">{p.customersCount}</td>
                      <td className="px-5 py-4 font-mono text-emerald-600 font-bold">{p.activeConnections}</td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{formatCurrency(p.monthlyBilling)}</td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600">{formatCurrency(p.collected)}</td>
                      <td className="px-5 py-4 font-mono font-black text-rose-600 text-right">{formatCurrency(p.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pending Dues Report */}
          {reportType === 'PENDING' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Subscriber</th>
                    <th className="px-5 py-3.5">Connection ID</th>
                    <th className="px-5 py-3.5">Bill Number</th>
                    <th className="px-5 py-3.5">Billing Month</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5 text-right">Outstanding Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingReport.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {b.customerId?.name}
                        <span className="block text-[11px] font-mono text-slate-400">+91 {b.customerId?.phone}</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">{b.customerId?.connectionId}</td>
                      <td className="px-5 py-4 font-mono text-slate-600">{b.billNumber}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{b.billingMonthName}</td>
                      <td className="px-5 py-4 font-mono text-slate-600">{formatDate(b.dueDate)}</td>
                      <td className="px-5 py-4 font-mono font-black text-rose-600 text-right text-sm">
                        {formatCurrency(b.remainingAmount || b.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Collections Report */}
          {reportType === 'COLLECTIONS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Txn ID</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Billing Month</th>
                    <th className="px-5 py-3.5">Mode</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(collectionsReport?.payments || []).map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{p.transactionId}</td>
                      <td className="px-5 py-4 font-mono text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">{p.customerId?.name}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{p.billId?.billingMonthName}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{p.paymentMethod}</td>
                      <td className="px-5 py-4 font-mono font-black text-emerald-600 text-right text-sm">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Customer Summary Report */}
          {reportType === 'CUSTOMERS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Mobile</th>
                    <th className="px-5 py-3.5">Connection ID</th>
                    <th className="px-5 py-3.5">Provider</th>
                    <th className="px-5 py-3.5">Monthly</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Pending Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customersReport.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">{c.name}</td>
                      <td className="px-5 py-4 font-mono text-slate-600">+91 {c.phone}</td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">{c.connectionId}</td>
                      <td className="px-5 py-4 font-semibold text-sky-700">{c.providerId?.name}</td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{formatCurrency(c.monthlyAmount)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600">{c.status}</td>
                      <td className="px-5 py-4 font-mono font-black text-right text-rose-600">{formatCurrency(c.totalPending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
