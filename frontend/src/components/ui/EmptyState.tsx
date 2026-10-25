import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#667085] mb-3">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h3 className="text-sm font-semibold text-[#17212F] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#667085] max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
