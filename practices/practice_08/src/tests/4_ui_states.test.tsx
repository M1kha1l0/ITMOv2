import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { IssueList } from '../components/IssueList';

describe('Критерий 10: Состояния интерфейса и подмена ответов сервера', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('отображает состояние пустых данных (Empty State), когда обращений нет', () => {
    render(<IssueList issues={[]} onSelectIssue={vi.fn()} />);

    expect(screen.getByTestId('empty-issues-state')).toBeInTheDocument();
    expect(screen.getByText(/Нет обработанных Issue/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Заполните форму слева, чтобы отправить первое обращение/i)
    ).toBeInTheDocument();
  });

  it('отображает состояние загрузки (Loading State) при ожидании ответа n8n', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(global, 'fetch').mockImplementation(() => fetchPromise as Promise<Response>);

    render(<App />);

    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    const bodyInput = screen.getByLabelText(/Описание проблемы/i);

    await user.type(titleInput, '[Bug] Timeout during file export');
    await user.type(bodyInput, 'Long export operations time out after 30 seconds.');

    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    fireEvent.click(submitBtn);

    // Verify loading spinner & text
    expect(screen.getByText(/Классификация в n8n.../i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
    expect(titleInput).toBeDisabled();

    // Resolve response
    resolvePromise!({
      ok: true,
      json: async () => ({
        type: 'bug',
        confidence: 0.95,
        reasoning: 'Timeout bug',
      }),
    });

    await waitFor(() => {
      expect(screen.queryByText(/Классификация в n8n.../i)).not.toBeInTheDocument();
    });
  });

  it('отображает состояние ошибки (Error State) при сбое сервера и дает возможность повторить (Retry)', async () => {
    const user = userEvent.setup();

    // First fetch call fails with 500
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'n8n workflow execution failed',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'bug',
          confidence: 0.9,
          reasoning: 'Resolved on retry',
        }),
      } as Response);

    render(<App />);

    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    const bodyInput = screen.getByLabelText(/Описание проблемы/i);

    await user.type(titleInput, '[Bug] Server error repro');
    await user.type(bodyInput, 'Steps to reproduce the server 500 response.');

    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    fireEvent.click(submitBtn);

    // Error alert appears
    await waitFor(() => {
      expect(screen.getByText(/Ошибка отправки в n8n/i)).toBeInTheDocument();
      expect(screen.getByText(/Ошибка сервиса n8n \(500\)/i)).toBeInTheDocument();
    });

    // Retry button is available
    const retryBtn = screen.getByRole('button', { name: /Повторить попытку \(Retry\)/i });
    expect(retryBtn).toBeInTheDocument();

    // Click retry
    fireEvent.click(retryBtn);

    // Second call succeeds
    await waitFor(() => {
      expect(screen.getByText(/Issue успешно обработан/i)).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
