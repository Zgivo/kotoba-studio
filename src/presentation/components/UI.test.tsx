import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState, ProgressBar } from './UI';

describe('shared UI', () => {
  it('renders an actionable empty state', () => {
    render(<EmptyState title="Пока пусто" text="Добавьте первый урок." action={<button>Добавить</button>} />);
    expect(screen.getByRole('heading', { name: 'Пока пусто' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeInTheDocument();
  });

  it('labels progress accessibly and clamps width', () => {
    const { container } = render(<ProgressBar value={120} label="Урок 1" />);
    expect(screen.getByLabelText('Урок 1')).toBeInTheDocument();
    expect(container.querySelector('.progress span')).toHaveStyle({ width: '100%' });
  });
});
