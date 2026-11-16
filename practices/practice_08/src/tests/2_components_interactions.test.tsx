import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { IssueDetailsModal } from '../components/IssueDetailsModal';
import { Issue } from '../types/issue';

describe('Критерий 8: Тестирование компонентов и взаимодействий', () => {
  it('отображает кнопки разных вариантов и обрабатывает клики', async () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Нажми меня
      </Button>
    );

    const btn = screen.getByRole('button', { name: /Нажми меня/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('отображает бейджи со всеми семантическими статусами', () => {
    const { rerender } = render(<Badge type="bug" />);
    expect(screen.getByText(/bug/i)).toBeInTheDocument();

    rerender(<Badge type="feature" />);
    expect(screen.getByText(/feature/i)).toBeInTheDocument();

    rerender(<Badge type="task" />);
    expect(screen.getByText(/task/i)).toBeInTheDocument();

    rerender(<Badge type="unknown" />);
    expect(screen.getByText(/needs-triage/i)).toBeInTheDocument();
  });

  it('корректно открывает и закрывает модальное окно через кнопку и клавишу Escape', async () => {
    const handleClose = vi.fn();

    const sampleIssue: Issue = {
      id: '#42',
      title: 'Crash on startup',
      body: 'Application exits with code 1 immediately.',
      author: 'dev',
      type: 'bug',
      confidence: 0.98,
      reasoning: 'Critical crash at initialization.',
      label: 'bug',
      commentPosted: true,
      createdAt: '5m',
    };

    const { rerender } = render(<IssueDetailsModal issue={sampleIssue} onClose={handleClose} />);

    // Check modal contents
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Детали обращения: #42/i)).toBeInTheDocument();
    expect(screen.getByText(/Critical crash at initialization/i)).toBeInTheDocument();

    // Close via close button (top or bottom)
    const closeButtons = screen.getAllByRole('button', { name: /Закрыть/i });
    fireEvent.click(closeButtons[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Close via Escape key
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);

    // If issue is null, modal should not render
    rerender(<IssueDetailsModal issue={null} onClose={handleClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
