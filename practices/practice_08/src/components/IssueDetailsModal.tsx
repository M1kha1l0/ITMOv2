import React from 'react';
import { Issue } from '../types/issue';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Bot, CheckCircle2, XCircle } from 'lucide-react';

interface IssueDetailsModalProps {
  issue: Issue | null;
  onClose: () => void;
}

export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({ issue, onClose }) => {
  if (!issue) return null;

  return (
    <Modal
      isOpen={Boolean(issue)}
      onClose={onClose}
      title={`Детали обращения: ${issue.id}`}
    >
      <div className="space-y-4">
        {/* Triage summary card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Результат Sub-workflow классификатора
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Категория:</span>
            <Badge type={issue.type} label={issue.label} />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Уверенность AI:</span>
            <span className="text-sm font-bold text-slate-900">
              {Math.round(issue.confidence * 100)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Комментарий в GitHub:</span>
            {issue.commentPosted ? (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-700 gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Опубликован
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-amber-700 gap-1">
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Пропущен (Unknown / Needs Triage)
              </span>
            )}
          </div>
        </div>

        {/* AI Reasoning block */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            AI-обоснование (Structured Output Parser)
          </h4>
          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
            {issue.reasoning}
          </div>
        </div>

        {/* Issue content */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Заголовок и автор
          </h4>
          <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">Автор: @{issue.author}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Исходный текст проблемы
          </h4>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {issue.body}
          </div>
        </div>
      </div>
    </Modal>
  );
};
