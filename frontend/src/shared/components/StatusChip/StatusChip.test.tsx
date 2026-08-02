import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import StatusChip from './StatusChip';

describe('StatusChip', () => {
  it('uses the central label map for lifecycle statuses', () => {
    renderWithProviders(
      <>
        <StatusChip value="IN_PROGRESS" />
        <StatusChip value="ADJUSTMENTS_CREATED" />
      </>,
    );

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Adjustments Created')).toBeInTheDocument();
  });

  it('formats unknown enum values through the shared fallback', () => {
    renderWithProviders(<StatusChip value="CUSTOM_REVIEW_STATE" />);

    expect(screen.getByText('Custom Review State')).toBeInTheDocument();
  });

  it('renders nothing when no status is provided', () => {
    const { container } = renderWithProviders(<StatusChip value={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
