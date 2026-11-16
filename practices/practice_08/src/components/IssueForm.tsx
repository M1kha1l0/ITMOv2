import React, { useState } from 'react';
import { TriageRequest, FormErrors } from '../types/issue';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Send } from 'lucide-react';

interface IssueFormProps {
  onSubmit: (data: TriageRequest) => Promise<void>;
  isSubmitting: boolean;
}

export const IssueForm: React.FC<IssueFormProps> = ({ onSubmit, isSubmitting }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('M1kha1l0');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Заголовок Issue обязателен для заполнения';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Заголовок должен содержать минимум 5 символов';
    }

    if (!body.trim()) {
      newErrors.body = 'Описание проблемы обязательно для заполнения';
    } else if (body.trim().length < 10) {
      newErrors.body = 'Описание должно содержать минимум 10 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Critical: Anti-Double-Submit Gate
    if (isSubmitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        author: author.trim() || 'contributor',
      });
      // Reset form on success
      setTitle('');
      setBody('');
      setErrors({});
    } catch {
      // Error handled in parent component
    }
  };

  const fillPreset = (type: 'bug' | 'ambiguous') => {
    if (type === 'bug') {
      setTitle('[Bug] OutOfMemoryError in WebSocket connection pool');
      setBody('Under heavy load, sessions are leaked causing an OutOfMemoryError. Repro: 100 concurrent WS connections.');
    } else {
      setTitle('Иногда не работает');
      setBody('Что-то нажимаю и ничего не происходит, почините пожалуйста приложение.');
    }
    setErrors({});
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Новое Issue на AI-триаж</CardTitle>
        <CardDescription>
          Отправка в n8n Sub-workflow классификатор с проверкой лейблов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="issue-title"
            name="title"
            label="Заголовок Issue"
            required
            value={title}
            disabled={isSubmitting}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Например: [Bug] Ошибка авторизации в токене..."
            hint="Минимум 5 символов. Отражает суть проблемы или фичи."
            error={errors.title}
          />

          <Textarea
            id="issue-body"
            name="body"
            label="Описание проблемы / запроса"
            required
            rows={4}
            value={body}
            disabled={isSubmitting}
            onChange={(e) => {
              setBody(e.target.value);
              if (errors.body) setErrors((prev) => ({ ...prev, body: undefined }));
            }}
            placeholder="Подробно опишите шаги воспроизведения, логи или требования к новой функциональности..."
            hint="Минимум 10 символов. Контекст для точной оценки AI."
            error={errors.body}
          />

          <Input
            id="issue-author"
            name="author"
            label="Автор Issue"
            prefixText="@"
            value={author}
            disabled={isSubmitting}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="GitHub username"
          />

          <div className="pt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => fillPreset('bug')}
              className="text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
            >
              Заполнить тестовым багом
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => fillPreset('ambiguous')}
              className="text-amber-600 hover:text-amber-800 font-medium disabled:opacity-50"
            >
              Тест needs-triage
            </button>
          </div>

          <Button
            type="submit"
            size="md"
            className="w-full mt-2"
            isLoading={isSubmitting}
            loadingText="Классификация в n8n..."
          >
            <Send className="w-4 h-4 mr-2" aria-hidden="true" />
            Отправить на AI-триаж в n8n
          </Button>

          <p className="text-xs text-center text-slate-400">
            Форма защищена от двойных кликов и спама Enter.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
