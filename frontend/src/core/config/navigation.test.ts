import { describe, expect, it } from 'vitest';
import { ROLES } from '../constants/roles';
import { getNavigationSectionsForRole } from './navigation';

function keysFor(role: (typeof ROLES)[keyof typeof ROLES]) {
  return getNavigationSectionsForRole(role).flatMap((section) => section.items.map((item) => item.key));
}

describe('role navigation contract', () => {
  it('shows workforce tasks to HR manager', () => {
    expect(keysFor(ROLES.HR_MANAGER)).toContain('tasks');
    expect(keysFor(ROLES.HR_MANAGER)).not.toContain('transport-orders');
  });

  it('shows company-scoped activity logs to company admin', () => {
    expect(keysFor(ROLES.COMPANY_ADMIN)).toContain('activity-logs');
  });

  it('keeps inventory counts away from dispatcher and driver', () => {
    expect(keysFor(ROLES.DISPATCHER)).not.toContain('inventory-counts');
    expect(keysFor(ROLES.DRIVER)).not.toContain('inventory-counts');
  });
});
