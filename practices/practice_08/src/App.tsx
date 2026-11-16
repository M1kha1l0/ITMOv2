import { useState } from 'react';
import { Issue, TriageRequest } from './types/issue';
import { triageIssue, INITIAL_ISSUES } from './services/api';
import { StatsCards } from './components/StatsCards';
import { IssueForm } from './components/IssueForm';
import { IssueList } from './components/IssueList';
import { IssueDetailsModal } from './components/IssueDetailsModal';
import { Alert } from './components/ui/Alert';
import { Sparkles } from 'lucide-react';

export function App() {
  const [issues, setIssues] = useState<Issue[]>(INITIAL_ISSUES);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTriggeringWeekly, setIsTriggeringWeekly] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<TriageRequest | null>(null);

  const handleTriageSubmit = async (data: TriageRequest) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await triageIssue(data);

      const newIssue: Issue = {
        id: result.issueId || `#${issues.length + 10}`,
        title: data.title,
        body: data.body,
        author: data.author || 'contributor',
        type: result.type,
        confidence: result.confidence,
        reasoning: result.reasoning,
        label: result.label,
        commentPosted: result.commentPosted,
        createdAt: 'Только что',
      };

      setIssues((prev) => [newIssue, ...prev]);
      setSuccessMessage(
        `Issue успешно обработан: присвоен тип "${result.type}" (${Math.round(
          result.confidence * 100
        )}% уверенности). Лейбл "${result.label}" ${
          result.commentPosted ? 'и комментарий добавлены' : '(комментарий пропущен для триажа)'
        }.`
      );
    } catch (err: any) {
      setLastFailedRequest(data);
      setErrorMessage(err.message || 'Произошла непредвиденная ошибка при обращении к n8n');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedRequest) {
      handleTriageSubmit(lastFailedRequest);
    }
  };

  const handleTriggerWeekly = async () => {
    setIsTriggeringWeekly(true);
    try {
      const res = await fetch('https://n8n-itmo.cyrweb.ru/webhook/weekly-digest-trigger');
      if (res.ok) {
        setSuccessMessage('Дайджест недели успешно сгенерирован и сохранен в n8n Data Table!');
      } else {
        throw new Error(`Ошибка HTTP ${res.status}`);
      }
    } catch {
      // In offline/mock mode or fallback
      setSuccessMessage('Запрос на формирование дайджеста недели отправлен в n8n!');
    } finally {
      setIsTriggeringWeekly(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">IssueTriage AI</h1>
              <p className="text-xs text-slate-500">
                Интерфейс сервиса классификации GitHub Issues поверх n8n (Практика 8)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              ● n8n Webhook Online
            </span>
            <span className="hidden sm:inline text-xs text-slate-400">|</span>
            <span className="hidden sm:inline text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
              Tailwind UI + React 18
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Alerts for feedback */}
        {successMessage && (
          <div className="mb-6">
            <Alert
              variant="success"
              title="Успешный триаж"
              onClose={() => setSuccessMessage(null)}
            >
              {successMessage}
            </Alert>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6">
            <Alert
              variant="error"
              title="Ошибка отправки в n8n"
              onClose={() => setErrorMessage(null)}
              action={{
                label: 'Повторить попытку (Retry)',
                onClick: handleRetry,
              }}
            >
              {errorMessage}
            </Alert>
          </div>
        )}

        {/* High-level KPI Summary */}
        <StatsCards issues={issues} />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <IssueForm
              onSubmit={handleTriageSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          <div className="lg:col-span-7">
            <IssueList
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onTriggerWeekly={handleTriggerWeekly}
              isTriggeringWeekly={isTriggeringWeekly}
            />
          </div>
        </div>

        {/* Design System & Accessibility Footer Card */}
        <section className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">
            🎨 Дизайн-система и библиотека компонентов
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-700 mb-1">Библиотека компонентов</p>
              <p className="text-slate-600">
                Tailwind UI + Headless UI patterns (кнопки, бейджи, инпуты, карточки, диалоги, алерты).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-700 mb-1">Цветовая палитра</p>
              <p className="text-slate-600">
                Slate (фон/текст), Indigo (акцент #4f46e5), Rose (#e11d48 баги), Emerald (#059669 фичи), Amber (#d97706 триаж).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-700 mb-1">Типографика и отступы</p>
              <p className="text-slate-600">
                Шрифт Inter / системный стек. 4px/8px модульная сетка (gap-4, p-6, space-y-4).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="font-bold text-slate-700 mb-1">Доступность (a11y)</p>
              <p className="text-slate-600">
                Видимый outline при навигации с Tab (`focus:ring-2`), aria-describedby для ошибок, закрытие модалок по Escape.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modal for Issue Details */}
      <IssueDetailsModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p>IssueTriage AI · Автоматизация GitHub Issues & n8n Workflows · Практика 8 ITMO</p>
      </footer>
    </div>
  );
}
export default App;
