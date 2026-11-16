import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  id,
  disabled,
  required,
  rows = 4,
  className = '',
  ...props
}) => {
  const textareaId = id || props.name || Math.random().toString(36).substring(2, 9);
  const hintId = `${textareaId}-hint`;
  const errorId = `${textareaId}-error`;

  return (
    <div className="w-full">
      <label htmlFor={textareaId} className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500 text-rose-900'
            : 'border-slate-300 bg-white'
        } ${className}`}
        {...props}
      />
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
