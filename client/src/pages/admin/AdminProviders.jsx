import React, { useState, useEffect } from 'react';
import { Radio, Plus, Users, Wifi, CreditCard, Clock, Edit2, Loader2, CheckCircle2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, getProviderBadge } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [providerForm, setProviderForm] = useState({
    name: '',
    code: '',
    description: '',
    color: '#0284c7',
    iconName: 'Wifi'
  });
  const [editingId, setEditingId] = useState(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/providers');
      if (res.success) {
        setProviders(res.providers || []);
      }
    } catch (err) {
      toast.error('Failed to load providers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setProviderForm({ name: '', code: '', description: '', color: '#0284c7', iconName: 'Wifi' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p._id);
    setProviderForm({
      name: p.name,
      code: p.code,
      description: p.description || '',
      color: p.color || '#0284c7',
      iconName: p.iconName || 'Wifi'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await axiosClient.put(`/providers/${editingId}`, providerForm);
        toast.success('Provider updated.');
      } else {
        await axiosClient.post('/providers', providerForm);
        toast.success('Provider created.');
      }
      setIsModalOpen(false);
      fetchProviders();
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Network Provider Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure partner ISP networks (BSNL, RailWire, GTPL), track lines, and monitor collections.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Provider</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map((p) => {
            const pBadge = getProviderBadge(p);
            return (
              <div
                key={p._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                        style={{ backgroundColor: p.color || '#0284c7' }}
                      >
                        {p.code?.slice(0, 2) || 'PR'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                          {p.name}
                        </h3>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          CODE: {p.code}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Provider"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-5 min-h-[36px]">
                    {p.description || 'Broadband and cable television distribution provider.'}
                  </p>

                  {/* Provider Live Statistics */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Subscribers</span>
                      <span className="font-extrabold text-slate-900 text-base font-mono">
                        {p.customerCount || 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Active Lines</span>
                      <span className="font-extrabold text-emerald-600 text-base font-mono">
                        {p.activeConnections || 0}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Monthly Runrate</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatCurrency(p.monthlyBilling || 0)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Pending Dues</span>
                      <span className="font-bold text-rose-600 font-mono">
                        {formatCurrency(p.pendingAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px]">Collected: <strong className="text-emerald-600 font-mono">{formatCurrency(p.collectedAmount || 0)}</strong></span>
                  <StatusBadge status={p.status} size="xs" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Provider' : 'Add New Provider'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Provider Name *</label>
            <input
              type="text"
              required
              value={providerForm.name}
              onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
              placeholder="e.g. BSNL Fiber"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Unique Code *</label>
            <input
              type="text"
              required
              value={providerForm.code}
              onChange={(e) => setProviderForm({ ...providerForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. BSNL"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Theme Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={providerForm.color}
                onChange={(e) => setProviderForm({ ...providerForm, color: e.target.value })}
                className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={providerForm.color}
                onChange={(e) => setProviderForm({ ...providerForm, color: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Description</label>
            <textarea
              rows={3}
              value={providerForm.description}
              onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
              placeholder="FTTH broadband partner network details..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update Provider' : 'Create Provider'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminProviders;
