import { describe, expect, it } from 'vitest';
import { isPositiveIntegerId, parsePositiveIntegerId } from './routeParams';

describe('route parameter IDs', () => {
  it.each(['1', '42', '9007199254740991'])(
    'accepts a positive integer route ID: %s',
    (value) => expect(parsePositiveIntegerId(value)).toBe(Number(value)),
  );

  it.each([undefined, null, '', ' ', '0', '-1', '1.5', 'NaN', '12abc'])(
    'rejects an invalid route ID: %s',
    (value) => expect(parsePositiveIntegerId(value)).toBeNull(),
  );

  it('rejects nullable and non-positive numeric query IDs', () => {
    expect(isPositiveIntegerId(null)).toBe(false);
    expect(isPositiveIntegerId(0)).toBe(false);
    expect(isPositiveIntegerId(-1)).toBe(false);
    expect(isPositiveIntegerId(1.5)).toBe(false);
    expect(isPositiveIntegerId(2)).toBe(true);
  });
});
