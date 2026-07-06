import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, userEvent } from '@/test/test-utils';
import DataTable from '../DataTable';
import type { DataTableColumn } from '@/shared/types/common.types';

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  active: boolean;
};

const columns: DataTableColumn<ProductRow>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortField: 'name' },
  { id: 'sku', header: 'SKU', accessor: 'sku' },
  {
    id: 'active',
    header: 'Active',
    render: (row) => (row.active ? 'Yes' : 'No'),
  },
];

const rows: ProductRow[] = [
  { id: 1, name: 'Euro pallet', sku: 'PAL-001', active: true },
  { id: 2, name: 'Storage box', sku: 'BOX-002', active: false },
];

describe('DataTable', () => {
  it('renders column headers and row values', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
      />,
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Euro pallet')).toBeInTheDocument();
    expect(screen.getByText('PAL-001')).toBeInTheDocument();
    expect(screen.getByText('Storage box')).toBeInTheDocument();
  });

  it('emits sort changes for sortable headers', async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        sort={{ field: 'name', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /name/i }));

    expect(onSortChange).toHaveBeenCalledWith({
      field: 'name',
      direction: 'desc',
    });
  });

  it('supports row click and keyboard activation', () => {
    const onRowClick = vi.fn();

    renderWithProviders(
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
        rowClickLabel="Open product details"
      />,
    );

    const interactiveRows = screen.getAllByRole('button', { name: /open product details/i });

    fireEvent.click(interactiveRows[0]);
    fireEvent.keyDown(interactiveRows[1], { key: 'Enter' });

    expect(onRowClick).toHaveBeenNthCalledWith(1, rows[0]);
    expect(onRowClick).toHaveBeenNthCalledWith(2, rows[1]);
  });

  it('renders the configured empty state when there are no rows', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        rows={[]}
        emptyTitle="No products"
        emptyDescription="The catalog is empty."
      />,
    );

    expect(screen.getByText('No products')).toBeInTheDocument();
    expect(screen.getByText('The catalog is empty.')).toBeInTheDocument();
  });
});
