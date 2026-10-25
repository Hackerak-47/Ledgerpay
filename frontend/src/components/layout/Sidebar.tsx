import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Send,
  Receipt,
  BookOpen,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Wallet', to: '/wallet', icon: Wallet },
    { name: 'Send Money', to: '/send', icon: Send },
    { name: 'Transactions', to: '/transactions', icon: Receipt },
    { name: 'Ledger Explorer', to: '/ledger', icon: BookOpen },
  ];

  return (
    <aside className="w-60 bg-[#172B4D] text-white flex flex-col shrink-0 min-h-screen border-r border-[#172B4D]">
      <div className="h-16 flex items-center px-5 border-b border-white/10 gap-3">
        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20">
          <svg
            className="w-4 h-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="13" height="11" rx="1.5" />
            <rect x="8" y="9" width="13" height="11" rx="1.5" strokeOpacity="0.75" />
          </svg>
        </div>
        <div>
          <span className="font-bold tracking-tight text-base text-white">LedgerPay</span>
          <span className="block text-[10px] uppercase font-semibold text-slate-300 tracking-wider">
            Settlement Core
          </span>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-[#218568] shrink-0" />
          <span>Double-Entry Verified</span>
        </div>

        <div className="flex items-center justify-between px-2 pt-1 text-xs">
          <div className="truncate mr-2">
            <p className="font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
