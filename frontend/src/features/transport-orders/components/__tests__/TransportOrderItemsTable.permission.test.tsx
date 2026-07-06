import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import TransportOrderItemsTable from '../TransportOrderItemsTable';
import type { TransportOrderItemResponse } from '../../types/transportOrder.types';

const row: TransportOrderItemResponse = {
  id: 1,
  quantity: 5,
  reservedQuantity: 0,
  dispatchedQuantity: 0,
  deliveredQuantity: 0,
  weight: 12,
  note: 'Test item',
  transportOrderId: 10,
  productId: 20,
};

describe('TransportOrderItemsTable permission rendering', () => {
  it('hides Delete when row actions are disabled for a non-manager role such as WORKER', () => {
    renderWithProviders(
      <TransportOrderItemsTable
        rows={[row]}
        showActions={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Product #20')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('shows Delete only when the parent page explicitly enables row actions', () => {
    renderWithProviders(
      <TransportOrderItemsTable
        rows={[row]}
        showActions
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});
