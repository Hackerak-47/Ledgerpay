import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  className = '',
}) => {
  const config = {
    info: {
      bg: 'bg-slate-50',
      border: 'border-slate-300',
      text: 'text-[#17212F]',
      icon: <Info className="w-4 h-4 text-[#344563] shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-[#17212F]',
      icon: <CheckCircle className="w-4 h-4 text-[#218568] shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-[#17212F]',
      icon: <AlertTriangle className="w-4 h-4 text-[#B7791F] shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-[#17212F]',
      icon: <AlertCircle className="w-4 h-4 text-[#C2414B] shrink-0 mt-0.5" />,
    },
  }[type];

  return (
    <div className={`p-3 rounded border text-xs flex gap-2.5 ${config.bg} ${config.border} ${config.text} ${className}`}>
      {config.icon}
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
