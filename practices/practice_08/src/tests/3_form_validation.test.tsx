import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueForm } from '../components/IssueForm';

describe('Критерий 9: Валидация форм и сообщения об ошибках', () => {
  it('выводит ошибки при отправке пустой формы и блокирует отправку', async () => {
    const mockSubmit = vi.fn();
    render(<IssueForm onSubmit={mockSubmit} isSubmitting={false} />);

    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    fireEvent.click(submitBtn);

    // Verify errors appeared
    expect(screen.getByText(/Заголовок Issue обязателен для заполнения/i)).toBeInTheDocument();
    expect(screen.getByText(/Описание проблемы обязательно для заполнения/i)).toBeInTheDocument();

    // Verify submit callback was NOT called
    expect(mockSubmit).not.toHaveBeenCalled();

    // Verify accessibility attributes
    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('выводит ошибку при слишком коротком заголовке (< 5 символов)', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<IssueForm onSubmit={mockSubmit} isSubmitting={false} />);

    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    const bodyInput = screen.getByLabelText(/Описание проблемы/i);

    await user.type(titleInput, 'Баг');
    await user.type(bodyInput, 'Достаточно длинное описание проблемы на 30 символов');

    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Заголовок должен содержать минимум 5 символов/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('выводит ошибку при слишком коротком описании (< 10 символов)', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<IssueForm onSubmit={mockSubmit} isSubmitting={false} />);

    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    const bodyInput = screen.getByLabelText(/Описание проблемы/i);

    await user.type(titleInput, '[Bug] Корректный заголовок');
    await user.type(bodyInput, 'Коротко');

    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Описание должно содержать минимум 10 символов/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('очищает ошибку поля при начале ввода пользователем', async () => {
    const user = userEvent.setup();
    render(<IssueForm onSubmit={vi.fn()} isSubmitting={false} />);

    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Заголовок Issue обязателен для заполнения/i)).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    await user.type(titleInput, 'Х');

    expect(screen.queryByText(/Заголовок Issue обязателен для заполнения/i)).not.toBeInTheDocument();
  });
});
