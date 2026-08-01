import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InventoryFormPage from './InventoryFormPage';

const navigate = vi.fn();
const createMutate = vi.fn();
const updateMutate = vi.fn();
const routeParams: { warehouseId?: string; productId?: string } = {};
let inventoryRecordData: {
  record: {
    version: number;
    warehouseId: number;
    warehouseName: string;
    productId: number;
    productName: string;
    quantity: number;
    minStockLevel: number;
  };
  warehouse: null;
  product: null;
} | null = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate, useParams: () => routeParams };
});

vi.mock('../../../core/auth/authStore', () => ({
  useAuthStore: () => ({ user: { role: 'OVERLORD' } }),
}));

vi.mock('../../lookup', () => ({
  EntityLookupField: ({ label, onChange }: { label: string; onChange: (option: unknown) => void }) => (
    <button
      type="button"
      onClick={() => onChange({
        id: label === 'Warehouse' ? 11 : 22,
        label: `${label} option`,
        status: 'ACTIVE',
      })}
    >
      Select {label}
    </button>
  ),
}));

vi.mock('../hooks/useInventoryRecord', () => ({
  useInventoryRecord: () => ({ data: inventoryRecordData, isLoading: false, isError: false, refetch: vi.fn() }),
}));

vi.mock('../hooks/useInventoryMutations', () => ({
  useCreateInventoryRecord: () => ({ mutate: createMutate, isPending: false, error: null }),
  useUpdateInventoryRecord: () => ({ mutate: updateMutate, isPending: false, error: null }),
}));

describe('InventoryFormPage workflows', () => {
  beforeEach(() => {
    createMutate.mockReset();
    updateMutate.mockReset();
    navigate.mockReset();
    delete routeParams.warehouseId;
    delete routeParams.productId;
    inventoryRecordData = null;
  });

  it('binds warehouse and product lookup selections into the create payload', () => {
    render(<InventoryFormPage mode="create" />);

    fireEvent.click(screen.getByRole('button', { name: 'Select Warehouse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Product' }));
    const [quantityInput, minimumInput] = screen.getAllByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '12' } });
    fireEvent.change(minimumInput, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create record' }));

    expect(createMutate).toHaveBeenCalledWith(
      { warehouseId: 11, productId: 22, quantity: 12, minStockLevel: 3 },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('keeps quantity read-only and omits it from the edit payload', () => {
    routeParams.warehouseId = '11';
    routeParams.productId = '22';
    inventoryRecordData = {
      record: {
        version: 4,
        warehouseId: 11,
        warehouseName: 'Main warehouse',
        productId: 22,
        productName: 'Euro pallet',
        quantity: 12,
        minStockLevel: 3,
      },
      warehouse: null,
      product: null,
    };

    render(<InventoryFormPage mode="edit" />);

    const quantityInput = screen.getByRole('spinbutton', { name: 'Quantity' });
    const minimumInput = screen.getByRole('spinbutton', { name: 'Minimum stock level' });
    expect(quantityInput).toBeDisabled();
    fireEvent.change(minimumInput, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateMutate).toHaveBeenCalledWith(
      {
        warehouseId: 11,
        productId: 22,
        data: {
          expectedVersion: 4,
          warehouseId: 11,
          productId: 22,
          minStockLevel: 5,
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});
