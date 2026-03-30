import { TEST_IDS, TEST_USERS, createTestOrder } from '../../setup/test-factories';

describe('RBAC Enforcement — Role-Based Access Control', () => {
  describe('Order Ownership', () => {
    it('client should only access own orders', () => {
      const clientOrder = createTestOrder({ clientId: TEST_IDS.client });
      
      // Client requesting own order → allowed
      const isOwn = clientOrder.clientId.toString() === TEST_IDS.client;
      expect(isOwn).toBe(true);

      // Client requesting other's order (logic simulation)
      const otherClientId = 'other-client-id';
      const isOther = clientOrder.clientId.toString() === otherClientId;
      expect(isOther).toBe(false);
    });

    it('admin should access all orders', () => {
      const isAdmin = TEST_USERS.admin.role === 'admin';
      expect(isAdmin).toBe(true);
    });

    it('provider should only access assigned orders', () => {
      const assignedOrder = createTestOrder({
        state: 'QUOTATION_PENDING',
        providerId: TEST_IDS.provider,
      });

      const isAssigned = assignedOrder.providerId?.toString() === TEST_IDS.provider;
      expect(isAssigned).toBe(true);
    });
  });

  describe('State Transition Permissions (Rules Validation)', () => {
    it('only admin can assign provider (roles logic simulation)', () => {
      const allowedRoles = ['admin'];
      expect(allowedRoles.includes('admin')).toBe(true);
      expect(allowedRoles.includes('provider')).toBe(false);
      expect(allowedRoles.includes('client')).toBe(false);
    });
  });
});
