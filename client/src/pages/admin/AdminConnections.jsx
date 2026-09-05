import React, { useState, useEffect } from 'react';
import { Wifi, Search, CheckCircle2, PauseCircle, XCircle, Loader2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, getProviderBadge } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminConnections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.append('status', statusFilter);
      if (search) query.append('search', search);

      const res = await axiosClient.get(`/connections?${query.toString()}`);
      if (res.success) {
        setConnections(res.connections || []);
      }
    } catch (err) {
      toast.error('Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchConnections, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await axiosClient.put(`/connections/${id}/status`, { status: newStatus });
      if (res.success) {
        toast.success(res.message);
        fetchConnections();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update connection status.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
          Connection Line Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor subscriber ONT hardware, optical links, suspension, and line reactivations.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connection ID, subscriber name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <span className="font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All States</option>
            <option value="ACTIVE">Active (Live)</option>
            <option value="SUSPENDED">Suspended (Due/Hold)</option>
            <option value="DISCONNECTED">Disconnected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Wifi className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Connections Found</h3>
          <p className="text-xs text-slate-500 mt-1">No physical lines match the selected criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Connection ID</th>
                  <th className="px-5 py-3.5">Subscriber</th>
                  <th className="px-5 py-3.5">Provider</th>
                  <th className="px-5 py-3.5">Plan & Speed</th>
                  <th className="px-5 py-3.5">Monthly</th>
                  <th className="px-5 py-3.5">Installed</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Line Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {connections.map((c) => {
                  const pBadge = getProviderBadge(c.providerId);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {c.connectionNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{c.customerId?.name || 'Customer'}</div>
                        <div className="text-slate-400 text-[11px] font-mono">+91 {c.customerId?.phone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-md border ${pBadge.bg} ${pBadge.textColor}`}>
                          {c.providerId?.name || 'BSNL'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{c.planId?.name}</div>
                        <div className="text-slate-400 text-[11px]">{c.planId?.speed}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {formatCurrency(c.monthlyAmount)}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(c.installationDate)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={c.status} size="xs" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {c.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleUpdateStatus(c._id, 'SUSPENDED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(c._id, 'ACTIVE')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConnections;
