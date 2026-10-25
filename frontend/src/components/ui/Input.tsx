import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#17212F] mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm bg-white border rounded focus:outline-none focus:ring-1 transition-colors ${
            error
              ? 'border-[#C2414B] focus:border-[#C2414B] focus:ring-[#C2414B]'
              : 'border-[#DFE3E8] focus:border-[#172B4D] focus:ring-[#172B4D]'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#C2414B]">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#667085]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
