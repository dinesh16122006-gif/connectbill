import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Wifi,
  FileText,
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Edit2
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, getProviderBadge } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminCustomerDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/customers/${id}`);
      if (res.success) {
        setData(res.customer);
      }
    } catch (err) {
      toast.error('Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Customer Not Found</h3>
        <Link to="/admin/customers" className="mt-3 inline-block text-xs font-bold text-sky-600 hover:underline">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  const pBadge = getProviderBadge(data.providerId);
  const bills = data.bills || [];
  const payments = data.payments || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <StatusBadge status={data.status} />
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 font-black text-xl flex items-center justify-center font-mono">
              {data.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                  {data.name}
                </h1>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${pBadge.bg} ${pBadge.textColor}`}>
                  {data.providerId?.name || 'Broadband'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-mono font-bold text-slate-800">{data.connectionId}</span>
                <span>•</span>
                <span className="font-mono">+91 {data.phone}</span>
                {data.email && (
                  <>
                    <span>•</span>
                    <span>{data.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Pending Dues</span>
            <div className="text-2xl font-black text-rose-600 font-mono">
              {formatCurrency(data.totalPending)}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Plan & Speed</span>
            <span className="font-bold text-slate-800 text-sm">
              {data.planId?.name || 'High Speed Plan'} ({data.planId?.speed || '100 Mbps'})
            </span>
            <span className="text-slate-500 block">{formatCurrency(data.monthlyAmount)} / month</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Installation Address</span>
            <span className="text-slate-700 block font-medium">
              {data.address}, {data.area}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Billing Cycle & Joined</span>
            <span className="text-slate-700 block font-medium">
              Due on {data.dueDay || 10}th • Joined {formatDate(data.joiningDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Two Columns: Bills & Payment Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill Statements */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Generated Bills ({bills.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">All Billing Cycles</span>
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No bills generated.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {bills.map((b) => (
                <div key={b._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{b.billingMonthName}</div>
                    <div className="text-slate-400 text-[11px] font-mono">
                      #{b.billNumber} • Due: {formatDate(b.dueDate)}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2.5">
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">
                        {formatCurrency(b.totalAmount)}
                      </span>
                      {b.remainingAmount > 0 && (
                        <span className="text-[10px] text-rose-600 font-mono block">
                          Bal: {formatCurrency(b.remainingAmount)}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={b.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
              Payments & Receipts ({payments.length})
            </h3>
            <span className="text-xs text-emerald-600 font-mono font-bold">
              Total Paid: {formatCurrency(data.totalPaid)}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No payment records logged.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {payments.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-600 text-sm">
                      {formatCurrency(p.amount)}
                    </span>
                    <div className="text-slate-400 text-[11px]">
                      {formatDate(p.paymentDate)} • <strong className="text-slate-600">{p.paymentMethod}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 truncate max-w-[100px]">
                      {p.transactionId}
                    </span>
                    <Link
                      to={`/customer/receipt/${p._id}`}
                      target="_blank"
                      className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600"
                      title="Receipt"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Link>
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

export default AdminCustomerDetail;
