import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppErrorBoundary from './AppErrorBoundary';

function BrokenPage(): never {
  throw new Error('render failed');
}

describe('AppErrorBoundary', () => {
  it('renders recovery actions when a page throws during render', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenPage />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'This page could not be displayed' })).toBeInTheDocument();
    expect(screen.getByText('render failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('renders children while no error exists', () => {
    render(<AppErrorBoundary><div>Healthy page</div></AppErrorBoundary>);
    expect(screen.getByText('Healthy page')).toBeInTheDocument();
  });
});
