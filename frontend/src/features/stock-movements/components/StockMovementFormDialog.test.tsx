import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StockMovementFormDialog from './StockMovementFormDialog';
import type {
  StockMovementProductOption,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';

vi.mock('../../lookup', () => ({
  EntityLookupField: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: { id: number; label: string } | null;
    onChange: (value: { id: number; label: string } | null) => void;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => onChange({ id: label === 'Warehouse' ? 11 : label === 'Product' ? 22 : 33, label })}
    >
      {value?.label ?? `${label}: none`}
    </button>
  ),
}));

const warehouses: StockMovementWarehouseOption[] = [
  { id: 11, name: 'Central warehouse', city: 'Belgrade', status: 'ACTIVE' },
];
const products: StockMovementProductOption[] = [
  { id: 22, name: 'Test product', sku: 'TEST-22' },
];
const transportOrders: StockMovementTransportOrderOption[] = [
  { id: 33, orderNumber: 'TO-33', status: 'ASSIGNED' },
];

describe('StockMovementFormDialog', () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    onSubmit.mockReset();
  });

  it('updates watched lookup values and preserves the submit payload', async () => {
    render(
      <StockMovementFormDialog
        open
        warehouses={warehouses}
        products={products}
        transportOrders={transportOrders}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Warehouse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Product' }));
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });

    expect(screen.getByRole('button', { name: 'Warehouse' })).toHaveTextContent('Central warehouse');
    expect(screen.getByRole('button', { name: 'Product' })).toHaveTextContent('Test product');

    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      movementType: 'INBOUND',
      quantity: 5,
      warehouseId: 11,
      productId: 22,
      transportOrderId: null,
    }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Movement type' }));
    fireEvent.click(await screen.findByRole('option', { name: 'TRANSFER_IN' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Transport order' }));

    expect(screen.getByRole('button', { name: 'Transport order' })).toHaveTextContent('TO-33');
  });

  it('resets watched lookup values whenever the dialog is reopened', async () => {
    const { rerender } = render(
      <StockMovementFormDialog
        open
        warehouses={warehouses}
        products={products}
        transportOrders={transportOrders}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Warehouse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Product' }));
    expect(screen.getByRole('button', { name: 'Warehouse' })).toHaveTextContent('Central warehouse');

    rerender(
      <StockMovementFormDialog
        open={false}
        warehouses={warehouses}
        products={products}
        transportOrders={transportOrders}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );
    rerender(
      <StockMovementFormDialog
        open
        warehouses={warehouses}
        products={products}
        transportOrders={transportOrders}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Warehouse' })).toHaveTextContent('Warehouse: none');
      expect(screen.getByRole('button', { name: 'Product' })).toHaveTextContent('Product: none');
    });
  });
});
