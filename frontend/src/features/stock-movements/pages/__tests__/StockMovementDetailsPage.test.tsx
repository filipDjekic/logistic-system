import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { queryKeys } from '@/core/constants/queryKeys';
import { ROLES } from '@/core/constants/roles';
import {
  authenticateTestUser,
  createTestQueryClient,
  renderWithProviders,
  screen,
} from '@/test/test-utils';
import type { StockMovementResponse } from '../../types/stockMovement.types';
import StockMovementDetailsPage from '../StockMovementDetailsPage';

const movement = {
  id: 2297,
  movementType: 'INBOUND',
  status: 'EXECUTED',
  quantity: 12,
  quantityBefore: 30,
  quantityAfter: 42,
  warehouseId: 84,
  warehouseName: 'Company secondary warehouse',
  productId: 51,
  productName: 'Packaging material',
  productSku: 'PKG-0051',
  reasonCode: 'PURCHASE_RECEIPT',
  createdAt: '2026-08-05T08:30:00',
  allowedNextStatuses: [],
} as StockMovementResponse;

describe('StockMovementDetailsPage company scope', () => {
  beforeEach(() => {
    authenticateTestUser(ROLES.WAREHOUSE_MANAGER);
  });

  it('renders a valid company-scoped movement instead of a generic error', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.stockMovements.detail(2297), movement);
    queryClient.setQueryData(queryKeys.stockMovements.statusTransitions(2297), {
      currentStatus: 'EXECUTED',
      allowedStatuses: [],
    });

    renderWithProviders(
      <Routes>
        <Route path="/stock-movements/:id" element={<StockMovementDetailsPage />} />
      </Routes>,
      {
        router: { initialEntries: ['/stock-movements/2297'] },
        queryClient,
      },
    );

    expect(screen.getByRole('heading', { name: /stock movement #2297/i })).toBeInTheDocument();
    expect(screen.queryByText('Stock movement could not be loaded')).not.toBeInTheDocument();
    expect(screen.queryByText('The requested stock movement details are not available.')).not.toBeInTheDocument();
  });
});
