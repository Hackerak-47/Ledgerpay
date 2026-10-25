import React from 'react';

type BadgeVariant = 'COMPLETED' | 'PENDING' | 'FAILED' | 'FLAGGED' | 'INCOMING' | 'OUTGOING' | 'DEBIT' | 'CREDIT' | 'ACTIVE' | 'SUSPENDED';

interface BadgeProps {
  variant: BadgeVariant | string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  const getStyles = (): string => {
    switch (variant.toUpperCase()) {
      case 'COMPLETED':
      case 'ACTIVE':
        return 'bg-emerald-50 text-[#218568] border border-emerald-200';
      case 'PENDING':
        return 'bg-slate-50 text-[#667085] border border-slate-200';
      case 'FAILED':
      case 'SUSPENDED':
        return 'bg-rose-50 text-[#C2414B] border border-rose-200';
      case 'FLAGGED':
        return 'bg-amber-50 text-[#B7791F] border border-amber-200';
      case 'INCOMING':
      case 'CREDIT':
        return 'bg-emerald-50 text-[#218568] font-medium';
      case 'OUTGOING':
      case 'DEBIT':
        return 'bg-rose-50 text-[#C2414B] font-medium';
      default:
        return 'bg-gray-100 text-[#17212F] border border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-tight ${getStyles()}`}
    >
      {children || variant}
    </span>
  );
};
