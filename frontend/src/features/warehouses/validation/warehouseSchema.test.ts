import { describe, expect, it } from 'vitest';
import { warehouseSchema } from './warehouseSchema';

const validWarehouse = {
  name: 'Central',
  address: 'Main street 1',
  cityId: 1,
  countryId: 1,
  timezoneId: 1,
  capacity: 100,
  employeeId: 2,
  companyId: '',
};

describe('warehouseSchema', () => {
  it('accepts a create form without client-controlled lifecycle status', () => {
    expect(warehouseSchema.safeParse(validWarehouse).success).toBe(true);
  });

  it('rejects zero and non-numeric capacity values', () => {
    expect(warehouseSchema.safeParse({ ...validWarehouse, capacity: 0 }).success).toBe(false);
    expect(warehouseSchema.safeParse({ ...validWarehouse, capacity: 'not-a-number' }).success).toBe(false);
  });
});
