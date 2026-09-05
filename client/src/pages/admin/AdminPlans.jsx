import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Loader2, CheckCircle2, Zap } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, getProviderBadge } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [planForm, setPlanForm] = useState({
    providerId: '',
    name: '',
    speed: '',
    monthlyPrice: '',
    type: 'FIBER',
    description: ''
  });

  const fetchPlansAndProviders = async () => {
    try {
      setLoading(true);
      const query = selectedProvider !== 'ALL' ? `?providerId=${selectedProvider}` : '';
      const [plansRes, provRes] = await Promise.all([
        axiosClient.get(`/plans${query}`),
        axiosClient.get('/providers')
      ]);

      if (plansRes.success) setPlans(plansRes.plans || []);
      if (provRes.success) setProviders(provRes.providers || []);
    } catch (err) {
      toast.error('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndProviders();
  }, [selectedProvider]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setPlanForm({
      providerId: providers[0]?._id || '',
      name: '',
      speed: '100 Mbps',
      monthlyPrice: '',
      type: 'FIBER',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingId(plan._id);
    setPlanForm({
      providerId: plan.providerId?._id || plan.providerId,
      name: plan.name,
      speed: plan.speed,
      monthlyPrice: plan.monthlyPrice,
      type: plan.type || 'FIBER',
      description: plan.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await axiosClient.put(`/plans/${editingId}`, planForm);
        toast.success('Plan updated.');
      } else {
        await axiosClient.post('/plans', planForm);
        toast.success('Plan created.');
      }
      setIsModalOpen(false);
      fetchPlansAndProviders();
    } catch (err) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await axiosClient.put(`/plans/${plan._id}`, { status: newStatus });
      toast.success(`Plan ${newStatus.toLowerCase()}.`);
      fetchPlansAndProviders();
    } catch (err) {
      toast.error('Failed to toggle status.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Subscription Plan Packages
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure tariff rates, allocated speeds, and OTT/Cable channel bundles for BSNL, RailWire, and GTPL.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plan</span>
        </button>
      </div>

      {/* Filter by provider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedProvider('ALL')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
            selectedProvider === 'ALL'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Networks
        </button>
        {providers.map((p) => (
          <button
            key={p._id}
            onClick={() => setSelectedProvider(p._id)}
            className={`px-3.5 py-2 rounded-xl font-bold transition-colors whitespace-nowrap ${
              selectedProvider === p._id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Plans Defined</h3>
          <p className="text-xs text-slate-500 mt-1">Create subscription packages for this provider network.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const pBadge = getProviderBadge(plan.providerId);
            return (
              <div
                key={plan._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${pBadge.bg} ${pBadge.textColor}`}>
                      {plan.providerId?.name || 'Broadband'}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                    {plan.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mt-2 mb-4">
                    <span className="text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                      {formatCurrency(plan.monthlyPrice)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5 text-xs text-slate-700 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Allocated Speed</span>
                      <strong className="font-mono text-sky-700">{plan.speed}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Package Type</span>
                      <span className="font-semibold text-slate-800">{plan.type}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {plan.description || 'Unlimited monthly high-speed broadband.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className="text-[11px] font-bold text-slate-600 hover:underline"
                  >
                    Toggle {plan.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  <StatusBadge status={plan.status} size="xs" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Subscription Plan' : 'Create Plan Package'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Provider Network *</label>
            <select
              required
              value={planForm.providerId}
              onChange={(e) => setPlanForm({ ...planForm, providerId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
            >
              {providers.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Plan Name *</label>
            <input
              type="text"
              required
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. RailWire Ultra 200"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Speed *</label>
              <input
                type="text"
                required
                value={planForm.speed}
                onChange={(e) => setPlanForm({ ...planForm, speed: e.target.value })}
                placeholder="e.g. 100 Mbps"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Monthly Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={planForm.monthlyPrice}
                onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                placeholder="699"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Category</label>
            <select
              value={planForm.type}
              onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
            >
              <option value="FIBER">Fiber (FTTH)</option>
              <option value="BROADBAND">Broadband / Wireless</option>
              <option value="CABLE_TV">Digital Cable TV</option>
              <option value="COMBO">Cable TV + Internet Combo</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">Description & Inclusions</label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Unlimited data, OTT subscriptions, symmetrical speed..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update Plan' : 'Save Plan Package'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPlans;
