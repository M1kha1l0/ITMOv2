import React from 'react';
import { Issue } from '../types/issue';
import { Bug, Sparkles, AlertTriangle, Layers } from 'lucide-react';

interface StatsCardsProps {
  issues: Issue[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ issues }) => {
  const total = issues.length;
  const bugs = issues.filter((i) => i.type === 'bug').length;
  const features = issues.filter((i) => i.type === 'feature').length;
  const triage = issues.filter((i) => i.type === 'unknown' || i.confidence < 0.8).length;

  const stats = [
    {
      id: 'total',
      label: 'Всего обработано',
      value: total,
      color: 'text-slate-900',
      bgColor: 'bg-indigo-50 text-indigo-600',
      icon: <Layers className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'bugs',
      label: 'Баги',
      value: bugs,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 text-rose-600',
      icon: <Bug className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'features',
      label: 'Фичи',
      value: features,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 text-emerald-600',
      icon: <Sparkles className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'triage',
      label: 'Needs Triage',
      value: triage,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 text-amber-600',
      icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-label="Сводные метрики">
      {stats.map((s) => (
        <div
          key={s.id}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`} data-testid={`kpi-${s.id}`}>
              {s.value}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${s.bgColor}`}>
            {s.icon}
          </div>
        </div>
      ))}
    </section>
  );
};
