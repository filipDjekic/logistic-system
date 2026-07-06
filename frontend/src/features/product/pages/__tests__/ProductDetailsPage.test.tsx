import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/test-utils';
import ProductDetailsPage from '../ProductDetailsPage';
import type { ProductResponse } from '../../types/product.types';

const useProductMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useProduct', () => ({
  useProduct: useProductMock,
}));

const product: ProductResponse = {
  id: 42,
  name: 'Euro pallet',
  description: 'Standard warehouse pallet',
  sku: 'PAL-042',
  unit: 'PIECE',
  price: 18.5,
  fragile: false,
  weight: 12,
  active: true,
  companyId: 7,
  companyName: 'Logistics Demo',
};

function renderProductDetails(route = '/products/42') {
  return renderWithProviders(
    <Routes>
      <Route path="/products/:id" element={<ProductDetailsPage />} />
    </Routes>,
    { router: { initialEntries: [route] } },
  );
}

describe('ProductDetailsPage', () => {
  beforeEach(() => {
    useProductMock.mockReset();
  });

  it('renders product overview details', () => {
    useProductMock.mockReturnValue({
      data: product,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderProductDetails();

    expect(screen.getByRole('heading', { name: 'Euro pallet' })).toBeInTheDocument();
    expect(screen.getByText('Product #42 • SKU PAL-042')).toBeInTheDocument();
    expect(screen.getByText('Product overview')).toBeInTheDocument();
    expect(screen.getByText('PAL-042')).toBeInTheDocument();
    expect(screen.getAllByText('Logistics Demo')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
  });

  it('renders invalid route id error instead of querying details', () => {
    renderProductDetails('/products/not-a-number');

    expect(screen.getByText('Invalid product')).toBeInTheDocument();
    expect(useProductMock).toHaveBeenCalledWith(null);
  });
});
