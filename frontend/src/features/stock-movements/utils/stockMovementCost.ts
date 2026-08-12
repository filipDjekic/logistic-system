const COST_SCALE = 4;
const COST_FACTOR = 10 ** COST_SCALE;

export type StockMovementCost = {
  unitCost: number;
  totalCost: number;
};

function roundHalfUp(value: number) {
  return Math.round((value + Number.EPSILON) * COST_FACTOR) / COST_FACTOR;
}

export function calculateStockMovementCost(
  quantity: number,
  unitCost: number,
): StockMovementCost | null {
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
    return null;
  }

  return {
    unitCost: roundHalfUp(unitCost),
    totalCost: roundHalfUp(quantity * unitCost),
  };
}
