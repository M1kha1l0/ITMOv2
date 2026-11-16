import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueForm } from '../components/IssueForm';

describe('Критерий 7: Защита от повторной отправки (Anti-Double-Submit)', () => {
  it('не отправляет второй запрос при повторном клике во время ожидания ответа', async () => {
    const user = userEvent.setup();
    let resolveRequest: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const mockSubmit = vi.fn().mockImplementation(() => pendingPromise);

    const { rerender } = render(<IssueForm onSubmit={mockSubmit} isSubmitting={false} />);

    // Fill valid form
    const titleInput = screen.getByLabelText(/Заголовок Issue/i);
    const bodyInput = screen.getByLabelText(/Описание проблемы/i);

    await user.type(titleInput, '[Bug] Database connection pool leak');
    await user.type(bodyInput, 'Under high concurrency sessions are not recycled properly.');

    const submitBtn = screen.getByRole('button', { name: /Отправить на AI-триаж в n8n/i });
    expect(submitBtn).toBeEnabled();

    // First click
    fireEvent.click(submitBtn);
    expect(mockSubmit).toHaveBeenCalledTimes(1);

    // Switch to isSubmitting: true as parent would
    rerender(<IssueForm onSubmit={mockSubmit} isSubmitting={true} />);

    // Attempt second and third rapid clicks while in-flight
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    // Press Enter in input
    fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' });

    // Assert that mockSubmit was still called EXACTLY ONCE
    expect(mockSubmit).toHaveBeenCalledTimes(1);

    // Check loading state on button
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Классификация в n8n.../i)).toBeInTheDocument();

    // Resolve in-flight request
    resolveRequest!();
    await waitFor(() => expect(submitBtn).toBeInTheDocument());
  });
});
