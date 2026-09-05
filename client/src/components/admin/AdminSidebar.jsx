import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wifi,
  Radio,
  Layers,
  FileText,
  CreditCard,
  AlertOctagon,
  Coins,
  BarChart3,
  Bell,
  LifeBuoy,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Connections', path: '/admin/connections', icon: Wifi },
    { label: 'Providers', path: '/admin/providers', icon: Radio },
    { label: 'Plans', path: '/admin/plans', icon: Layers },
    { label: 'Bills', path: '/admin/bills', icon: FileText },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Pending Bills', path: '/admin/pending-bills', icon: AlertOctagon },
    { label: 'Collections', path: '/admin/collections', icon: Coins },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Support Tickets', path: '/admin/support', icon: LifeBuoy },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-slate-300">
      <div>
        {/* Brand Logo & Close for mobile */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-base font-['Plus_Jakarta_Sans'] tracking-tight">
                Connect<span className="text-sky-400">Bill</span>
              </span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-500">
                Operator Admin
              </span>
            </div>
          </div>

          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="py-4 px-3 space-y-1 max-h-[calc(100vh-140px)] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-slate-800/40">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
              A
            </div>
            <div className="text-left truncate">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@operator.com'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-slate-800 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
