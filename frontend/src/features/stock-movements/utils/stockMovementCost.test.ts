import { describe, expect, it } from 'vitest';
import { calculateStockMovementCost } from './stockMovementCost';

describe('calculateStockMovementCost', () => {
  it('updates the four-decimal preview when quantity changes', () => {
    expect(calculateStockMovementCost(20, 500)).toEqual({ unitCost: 500, totalCost: 10000 });
    expect(calculateStockMovementCost(30, 500)).toEqual({ unitCost: 500, totalCost: 15000 });
  });

  it('does not expose binary floating point artifacts', () => {
    expect(calculateStockMovementCost(3, 0.1)?.totalCost).toBe(0.3);
  });
});
