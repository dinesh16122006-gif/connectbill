import React from 'react';
import { Wifi, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer id="contact" className="bg-slate-900 text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Overview */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md">
                <Wifi className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white font-['Plus_Jakarta_Sans'] tracking-tight">
                Connect<span className="text-sky-400">Bill</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Modern billing and customer management platform for Internet Service Providers and Cable TV operators across India.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
              <span>Razorpay Verified Gateway</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans']">
              Quick Portals
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/customer/login" className="hover:text-sky-400 transition-colors">
                  Customer Portal & Pay Bill
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-sky-400 transition-colors">
                  Cable Operator / Admin Portal
                </Link>
              </li>
              <li>
                <a href="#services" className="hover:text-sky-400 transition-colors">
                  BSNL, RailWire & GTPL Plans
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-sky-400 transition-colors">
                  Billing Features & Reminders
                </a>
              </li>
            </ul>
          </div>

          {/* Supported Providers */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans']">
              Supported Networks
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>BSNL Bharat Fiber (FTTH)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>RailWire Broadband (RailTel)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>GTPL Hathway Digital Cable & Net</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Local Independent Fiber Operators</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-['Plus_Jakarta_Sans']">
              Operator Contact
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Shop 14, City Centre Plaza, MG Road, Tech City - 560001</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>support@connectbill.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ConnectBill. All rights reserved. Built for Cable & Broadband Operators.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Indian Local Cable & Internet Operators
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
