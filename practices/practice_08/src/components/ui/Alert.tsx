import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  action,
  className = '',
}) => {
  const configs = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />,
      btn: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />,
      btn: 'bg-rose-600 text-white hover:bg-rose-700',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />,
      btn: 'bg-amber-600 text-white hover:bg-amber-700',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      icon: <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />,
      btn: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
  };

  const current = configs[variant];

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border text-sm flex items-start gap-3 transition-all ${current.bg} ${className}`}
    >
      {current.icon}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={`mt-2.5 px-3 py-1 rounded-md text-xs font-semibold transition ${current.btn}`}
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          aria-label="Закрыть уведомление"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
