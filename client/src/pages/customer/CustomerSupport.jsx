import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export const CustomerSupport = () => {
  const { customer } = useAuth();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [issue, setIssue] = useState('Internet Speed / Down');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !issue || !message) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/support', {
        name,
        phone,
        issue,
        message
      });

      if (res.success) {
        setSubmitted(true);
        toast.success('Support request logged successfully.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit inquiry.');
    } finally {
      setLoading(false);
    }
  };

  const whatsappNumber = '919876543210';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello ConnectBill Support, I need assistance with my connection (ID: ${customer?.connectionId || 'N/A'}).`
  )}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
          Customer Support & Help Desk
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Reach your cable operator directly or submit a technical ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Contact Info Cards */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm font-['Plus_Jakarta_Sans']">
              Operator Contact Info
            </h3>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Phone Helpline</span>
                <a href="tel:+919876543210" className="text-slate-500 hover:text-sky-600 font-mono">
                  +91 98765 43210
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Email Desk</span>
                <a href="mailto:support@connectbill.com" className="text-slate-500 hover:text-sky-600">
                  support@connectbill.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Working Hours</span>
                <span className="text-slate-500">9:00 AM - 8:00 PM (Mon - Sat)</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 block">Local Office</span>
                <span className="text-slate-500 leading-relaxed block">
                  Shop 14, City Centre Plaza, MG Road, Tech City - 560001
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center justify-between group block"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs block text-emerald-950">Chat on WhatsApp</span>
                <span className="text-[11px] text-emerald-700">Direct reply from line tech</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
              Open →
            </span>
          </a>
        </div>

        {/* Ticket Submission Form */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Request Received!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your ticket has been forwarded to the local line maintenance team. A technician will contact you shortly on <strong>+91 {phone}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="mt-4 px-4 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold rounded-xl"
                >
                  Submit Another Query
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm font-['Plus_Jakarta_Sans'] mb-2">
                  Submit a Support Ticket
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Contact Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Issue Category
                  </label>
                  <select
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
                  >
                    <option value="Internet Speed / Down">Internet Speed / Red Light on Router</option>
                    <option value="Cable TV Channels Issue">Cable TV / Set-Top Box Signal Issue</option>
                    <option value="Billing Dispute / Payment Query">Billing Dispute / Payment Query</option>
                    <option value="Plan Upgrade Request">Plan Upgrade / Speed Change</option>
                    <option value="Connection Relocation">Connection Relocation / Address Shift</option>
                    <option value="Other">Other Technical Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Description of Issue
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue you're experiencing in detail..."
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Ticket to Operator</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;
