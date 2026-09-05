import React, { useState, useEffect } from 'react';
import { LifeBuoy, CheckCircle2, Clock, Phone, Loader2, Edit2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/support');
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      toast.error('Failed to load support requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await axiosClient.put(`/support/${id}`, { status });
      if (res.success) {
        toast.success(`Ticket marked as ${status}.`);
        fetchTickets();
      }
    } catch (err) {
      toast.error('Failed to update ticket status.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
          Customer Support & Issue Desk
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review technical faults, speed issues, and channel complaints reported by subscribers.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Support Inquiries</h3>
          <p className="text-xs text-slate-500 mt-1">There are no open customer complaints.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((t) => (
            <div key={t._id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                      {t.issue}
                    </h3>
                    <span className="text-xs text-slate-400 block font-mono mt-0.5">
                      {formatDate(t.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={t.status} size="xs" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                  {t.message}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div>
                    <span className="font-bold text-slate-800 block">{t.name}</span>
                    <a href={`tel:${t.phone}`} className="font-mono text-sky-600 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> +91 {t.phone}
                    </a>
                  </div>
                  {t.customerId?.connectionId && (
                    <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                      {t.customerId.connectionId}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Change Status:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(t._id, 'IN_PROGRESS')}
                    className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(t._id, 'RESOLVED')}
                    className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold"
                  >
                    Resolve ✓
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
