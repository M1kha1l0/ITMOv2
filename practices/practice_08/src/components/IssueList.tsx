import React from 'react';
import { Issue } from '../types/issue';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Inbox, ExternalLink, Calendar } from 'lucide-react';

interface IssueListProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onTriggerWeekly?: () => void;
  isTriggeringWeekly?: boolean;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onSelectIssue,
  onTriggerWeekly,
  isTriggeringWeekly = false,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle>Поток обработанных обращений</CardTitle>
          <CardDescription>
            Результаты работы n8n Workflow и присвоенные лейблы
          </CardDescription>
        </div>
        {onTriggerWeekly && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onTriggerWeekly}
            isLoading={isTriggeringWeekly}
            loadingText="Генерация..."
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            Дайджест недели
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {issues.length === 0 ? (
          <div
            className="py-16 text-center"
            data-testid="empty-issues-state"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-slate-400" aria-hidden="true" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Нет обработанных Issue
            </h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Заполните форму слева, чтобы отправить первое обращение в нейросетевой классификатор n8n.
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="issues-stream-list">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {issue.id}
                    </span>
                    <Badge type={issue.type} label={issue.label} />
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      Уверенность AI: <b className="text-slate-700">{Math.round(issue.confidence * 100)}%</b>
                    </span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{issue.createdAt}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {issue.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {issue.reasoning}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectIssue(issue)}
                  className="shrink-0 self-end sm:self-center"
                  aria-label={`Посмотреть детали для ${issue.id}`}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                  Детали
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
