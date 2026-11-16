import React from 'react';
import { IssueType } from '../../types/issue';

export interface BadgeProps {
  type: IssueType | 'neutral';
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label, className = '' }) => {
  const configs: Record<IssueType | 'neutral', { bg: string; text: string; border: string; icon: string }> = {
    bug: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: '🐞',
    },
    feature: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: '✨',
    },
    task: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: '📋',
    },
    unknown: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: '⚠️',
    },
    neutral: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: '🏷️',
    },
  };

  const current = configs[type] || configs.neutral;
  const displayLabel = label || (type === 'unknown' ? 'needs-triage' : type);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span aria-hidden="true">{current.icon}</span>
      <span>{displayLabel}</span>
    </span>
  );
};
