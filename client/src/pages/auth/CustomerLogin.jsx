import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wifi, Phone, KeyRound, ArrowRight, ShieldCheck, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const CustomerLogin = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP'
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [customerName, setCustomerName] = useState('');

  const { sendCustomerOtp, customerLogin } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await sendCustomerOtp(cleanPhone);
      if (res.success) {
        toast.success(res.message);
        setStep('OTP');
        setCustomerName(res.customerName || '');
        if (res.devOtp) {
          setDevOtpHint(res.devOtp);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      toast.error('Please enter the OTP received.');
      return;
    }

    try {
      setLoading(true);
      const res = await customerLogin(phone, otp.trim());
      if (res.success) {
        toast.success(`Welcome back, ${res.customer?.name || 'Customer'}!`);
        navigate('/customer/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demoPhone) => {
    setPhone(demoPhone);
    setStep('PHONE');
    setOtp('');
    setDevOtpHint('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
            <Wifi className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight">
            Connect<span className="text-sky-600">Bill</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans']">
          Customer Portal Login
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered mobile number to view and pay your bills.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-8">
          {step === 'PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="90000 00001"
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-base font-mono font-medium"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  We'll send a 6-digit one-time verification password to this number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">OTP sent to +91 {phone}</span>
                  {customerName && <span className="text-[11px] text-sky-700">Account: {customerName}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('PHONE');
                    setOtp('');
                  }}
                  className="text-xs font-bold text-sky-600 hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Enter 6-Digit OTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="block w-full text-center tracking-[0.5em] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Dev Mock OTP Helper Hint */}
              {devOtpHint && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dev Mock OTP: <strong>{devOtpHint}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtpHint)}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs text-sky-600 hover:underline font-semibold"
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Test Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Customers
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => selectDemoAccount('9000000001')}
                className="p-2 rounded-xl border border-sky-100 bg-sky-50/60 hover:bg-sky-100 transition-colors"
              >
                <div className="font-bold text-sky-900">Ravi Kumar</div>
                <div className="text-[10px] text-sky-600">BSNL Fiber</div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('9000000002')}
                className="p-2 rounded-xl border border-amber-100 bg-amber-50/60 hover:bg-amber-100 transition-colors"
              >
                <div className="font-bold text-amber-900">Kumar</div>
                <div className="text-[10px] text-amber-600">RailWire</div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('9000000003')}
                className="p-2 rounded-xl border border-purple-100 bg-purple-50/60 hover:bg-purple-100 transition-colors"
              >
                <div className="font-bold text-purple-900">Suresh</div>
                <div className="text-[10px] text-purple-600">GTPL Cable</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500">
          Operator or Administrator?{' '}
          <Link to="/admin/login" className="font-bold text-sky-600 hover:underline">
            Login to Admin Portal →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
