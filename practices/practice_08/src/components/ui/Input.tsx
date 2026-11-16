import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  prefixText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  id,
  prefixText,
  disabled,
  required,
  className = '',
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {prefixText && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
            {prefixText}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          className={`w-full rounded-lg border text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            prefixText ? 'pl-8 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
          } ${
            error
              ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500 text-rose-900'
              : 'border-slate-300 bg-white'
          } ${className}`}
          {...props}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-rose-600 font-medium mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
