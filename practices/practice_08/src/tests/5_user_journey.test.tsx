import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { App } from '../App';

describe('Критерий 11: Полный пользовательский сценарий (End-to-End User Journey)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('проходит путь от заполнения формы до отображения классифицированного Issue и деталей в модалке', async () => {
    // Mock n8n server response for feature request
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: 'feature',
        confidence: 0.94,
        reasoning: 'User requests CSV and Excel export options for monthly reports.',
        issueId: '#99',
      }),
    } as Response);

    render(<App />);

    // 1. Initial State: Check initial KPI values
    const totalKpi = screen.getByTestId('kpi-total');
    expect(totalKpi).toHaveTextContent('3');

    // 2. Fill in form
    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    const bodyInput = screen.getByLabelText(/Описание проблемы/i);

    fireEvent.change(titleInput, { target: { value: 'Feature: Export reports to Excel format' } });
    fireEvent.change(bodyInput, {
      target: { value: 'Please add a button to export weekly statistics directly to xlsx format.' },
    });

    // 3. Submit form
    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    fireEvent.click(submitBtn);

    // 4. Assert Success Alert appeared
    await waitFor(() => {
      expect(
        screen.getByText(/Issue успешно обработан: присвоен тип "feature"/i)
      ).toBeInTheDocument();
    });

    // 5. Assert new Issue appears in the list
    expect(screen.getByText(/Feature: Export reports to Excel format/i)).toBeInTheDocument();
    expect(screen.getByText(/#99/i)).toBeInTheDocument();
    expect(screen.getAllByText(/94%/i).length).toBeGreaterThanOrEqual(1);

    // 6. Assert KPI updated (3 -> 4)
    expect(screen.getByTestId('kpi-total')).toHaveTextContent('4');

    // 7. Click "Детали" on the new issue
    const detailsButtons = screen.getAllByRole('button', { name: /Детали/i });
    fireEvent.click(detailsButtons[0]);

    // 8. Assert Modal dialog opened with full AI explanation
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Детали обращения: #99/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/User requests CSV and Excel export options for monthly reports/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Опубликован/i)).toBeInTheDocument();

    // 9. Close modal using the aria-label close button inside the dialog
    const closeBtn = within(dialog).getByLabelText('Закрыть');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
