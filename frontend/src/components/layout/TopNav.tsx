import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';

interface TopNavProps {
  title?: string;
  subtitle?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ title = 'Dashboard', subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-[#DFE3E8] px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-bold text-[#17212F] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#667085]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F4F6F8] border border-[#DFE3E8] text-[11px] text-[#344563] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#218568] animate-pulse" />
          <span>SIMULATED LEDGER ENVIRONMENT</span>
        </div>

        <div className="h-4 w-px bg-[#DFE3E8]" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#172B4D] text-white flex items-center justify-center text-xs font-semibold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-[#17212F] leading-none">{user?.name}</p>
            <p className="text-[10px] text-[#667085] mt-0.5 leading-none">Internal Ledger</p>
          </div>
        </div>
      </div>
    </header>
  );
};
