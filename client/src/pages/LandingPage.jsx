import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wifi,
  ShieldCheck,
  CreditCard,
  Receipt,
  History,
  Clock,
  ArrowRight,
  Tv,
  Zap,
  CheckCircle2,
  Users,
  Building,
  Smartphone
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
              Unified Billing for Local Cable & ISP Networks
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] tracking-tight leading-[1.15]">
              Your Internet & Cable Bills, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Managed Simply.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Manage your connection, view bills, pay online, and track payment history from one simple platform. Designed for local broadband & cable operators.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link
                to="/customer/login"
                className="w-full sm:w-auto px-7 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2.5 text-sm"
              >
                <Smartphone className="w-4 h-4" />
                <span>Customer Login (Pay Bill)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/admin/login"
                className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 text-sm"
              >
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Admin & Operator Login</span>
              </Link>
            </div>

            {/* Quick stats banner */}
            <div className="grid grid-cols-3 gap-4 pt-10 border-t border-slate-200/60 max-w-lg mx-auto text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">99.9%</div>
                <div className="text-xs text-slate-500 font-medium">Uptime Tracking</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-sky-600 font-['Plus_Jakarta_Sans']">0%</div>
                <div className="text-xs text-slate-500 font-medium">Convenience Fee</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-['Plus_Jakarta_Sans']">Instant</div>
                <div className="text-xs text-slate-500 font-medium">Digital Receipt</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Major Networks</span>
            <h2 className="text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
              Supported Internet & Cable Providers
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              ConnectBill brings together multi-provider management on a single centralized billing ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* BSNL */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Wifi className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">BSNL</h3>
              <p className="text-xs font-semibold text-sky-600 mb-2">Bharat Fiber FTTH & Broadband</p>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Internet connection and billing management. Track high-speed fiber lines, monthly renewals, optical power, and automated payment receipts.
              </p>
              <div className="flex items-center text-xs font-bold text-sky-700 gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>60 Mbps to 300 Mbps Plans</span>
              </div>
            </div>

            {/* RailWire */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">RailWire</h3>
              <p className="text-xs font-semibold text-amber-600 mb-2">RailTel Retail Broadband</p>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Internet connection and monthly bill management. Effortless subscriber renewal, pending dues notification via WhatsApp, and instant online checkout.
              </p>
              <div className="flex items-center text-xs font-bold text-amber-700 gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span>100 Mbps to Gigabit Fiber</span>
              </div>
            </div>

            {/* GTPL */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">GTPL</h3>
              <p className="text-xs font-semibold text-purple-600 mb-2">Digital Cable TV & Internet Combo</p>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Cable and internet connection billing management. Manage set-top box subscriptions, channel bundles, and combined broadband billing under one account.
              </p>
              <div className="flex items-center text-xs font-bold text-purple-700 gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>250+ HD Channels & Broadband</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Core Capabilities</span>
            <h2 className="text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans'] mt-1">
              Built Specifically for Cable & Internet Operators
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Everything required to collect bills faster, eliminate manual registers, and provide subscribers with a modern digital experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-300 transition-all shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-sky-50 text-sky-600 mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mb-2">
                Online Payment Gateway
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay instantly via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking. All transactions are cryptographically verified server-side.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-300 transition-all shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-amber-50 text-amber-600 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mb-2">
                Pending Bill Tracking
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Subscribers can inspect all unpaid and overdue bills. Multi-bill checkout lets users clear all pending months with a single order.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-300 transition-all shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-emerald-50 text-emerald-600 mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mb-2">
                Digital PDF Receipts
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated tax invoice / receipt generation with official company header, transaction ID, paid seal, and 1-click PDF download.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-300 transition-all shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-purple-50 text-purple-600 mb-4">
                <History className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mb-2">
                Payment History
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Searchable transaction archives with date filters, mode details (Cash, UPI, Online, Bank Transfer), and permanent receipt re-downloads.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-300 transition-all shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-blue-50 text-blue-600 mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mb-2">
                Secure OTP-Based Login
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Frictionless customer access via registered mobile number and OTP. No tedious passwords for customers to remember.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-sky-300 transition-all shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-rose-50 text-rose-600 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans'] mb-2">
                Complete Admin Management
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated monthly billing, counter cash recording with partial payments, live collection breakdown, Recharts analytics, and WhatsApp reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operator Callout Banner */}
      <section className="py-14 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h3 className="text-2xl sm:text-3xl font-black font-['Plus_Jakarta_Sans']">
            Are You a Cable Operator or Local ISP?
          </h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Stop losing track of pending dues and uncollected cash payments. Switch to ConnectBill and give your subscribers an effortless UPI payment experience.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin/login"
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 font-bold rounded-xl text-sm transition-all shadow-lg shadow-sky-600/30"
            >
              Access Admin Demo Portal
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
