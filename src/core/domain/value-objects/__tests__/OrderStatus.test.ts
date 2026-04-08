import { describe, it, expect } from 'vitest';
import { OrderStatus } from '../OrderStatus';
import type { TransitionContext } from '../OrderStatus';

describe('OrderStatus', () => {
  describe('create', () => {
    it('should create valid status', () => {
      const result = OrderStatus.create('DRAFT');
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('DRAFT');
    });

    it('should reject invalid status', () => {
      const result = OrderStatus.create('INVALID');
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Invalid order status');
    });
  });

  describe('transitions', () => {
    it('should allow DRAFT → PENDING_PAYMENT', () => {
      const draft = OrderStatus.draft();
      const result = draft.transitionTo('PENDING_PAYMENT');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('PENDING_PAYMENT');
    });

    it('should allow DRAFT → CANCELLED', () => {
      const draft = OrderStatus.draft();
      const result = draft.transitionTo('CANCELLED');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('CANCELLED');
    });

    it('should reject DRAFT → COMPLETED (skip states)', () => {
      const draft = OrderStatus.draft();
      const result = draft.transitionTo('COMPLETED');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('Invalid transition');
      expect(result.getError()).toContain('DRAFT → COMPLETED');
    });

    it('should reject transitions from terminal states', () => {
      const cancelled = OrderStatus.create('CANCELLED').getValue();
      const result = cancelled.transitionTo('DRAFT');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('terminal state');
    });

    it('should follow full happy path', () => {
      let status = OrderStatus.draft();

      const steps: Array<{ to: string; ctx?: TransitionContext }> = [
        { to: 'PENDING_PAYMENT' },
        { to: 'PAID', ctx: { paymentConfirmed: true } },
        { to: 'ASSIGNED' },
        { to: 'IN_PRODUCTION' },
        { to: 'INTERNAL_REVIEW' },
        { to: 'UNDER_REVIEW', ctx: { qaApproved: true } },
        { to: 'DELIVERED' },
        { to: 'COMPLETED' },
      ];

      for (const step of steps) {
        const result = status.transitionTo(step.to as any, step.ctx);
        expect(result.isSuccess()).toBe(true);
        status = result.getValue();
      }

      expect(status.value).toBe('COMPLETED');
      expect(status.isCompleted()).toBe(true);
    });
  });

  describe('guards', () => {
    it('should block PAID without payment confirmation', () => {
      const pending = OrderStatus.create('PENDING_PAYMENT').getValue();

      const withoutPayment = pending.transitionTo('PAID');
      expect(withoutPayment.isFailure()).toBe(true);
      expect(withoutPayment.getError()).toContain('payment confirmation');

      const withPayment = pending.transitionTo('PAID', {
        paymentConfirmed: true,
      });
      expect(withPayment.isSuccess()).toBe(true);
    });

    it('should block UNDER_REVIEW without QA approval', () => {
      const qa = OrderStatus.create('INTERNAL_REVIEW').getValue();

      const withoutQA = qa.transitionTo('UNDER_REVIEW', {
        qaApproved: false,
      });
      expect(withoutQA.isFailure()).toBe(true);
      expect(withoutQA.getError()).toContain('QA approval');

      const withQA = qa.transitionTo('UNDER_REVIEW', {
        qaApproved: true,
      });
      expect(withQA.isSuccess()).toBe(true);
    });

    it('should require reason for dispute', () => {
      const delivered = OrderStatus.create('DELIVERED').getValue();

      const withoutReason = delivered.transitionTo('DISPUTED');
      expect(withoutReason.isFailure()).toBe(true);
      expect(withoutReason.getError()).toContain('reason');

      const withReason = delivered.transitionTo('DISPUTED', {
        reason: 'Service quality below expectations',
      });
      expect(withReason.isSuccess()).toBe(true);
    });

    it('should require reason to return from INTERNAL_REVIEW to IN_PRODUCTION', () => {
      const qa = OrderStatus.create('INTERNAL_REVIEW').getValue();

      const withoutReason = qa.transitionTo('IN_PRODUCTION');
      expect(withoutReason.isFailure()).toBe(true);

      const withReason = qa.transitionTo('IN_PRODUCTION', {
        reason: 'Needs rework on deliverable #3',
      });
      expect(withReason.isSuccess()).toBe(true);
    });
  });

  describe('predicates', () => {
    it('isTerminal should identify terminal states', () => {
      expect(OrderStatus.create('CANCELLED').getValue().isTerminal()).toBe(true);
      expect(OrderStatus.create('REFUNDED').getValue().isTerminal()).toBe(true);
      expect(OrderStatus.create('DRAFT').getValue().isTerminal()).toBe(false);
    });

    it('isPaid should identify paid states', () => {
      expect(OrderStatus.create('PAID').getValue().isPaid()).toBe(true);
      expect(OrderStatus.create('IN_PRODUCTION').getValue().isPaid()).toBe(true);
      expect(OrderStatus.create('COMPLETED').getValue().isPaid()).toBe(true);
      expect(OrderStatus.create('DRAFT').getValue().isPaid()).toBe(false);
    });

    it('isCancellable should check transition availability', () => {
      expect(OrderStatus.draft().isCancellable()).toBe(true);
      expect(
        OrderStatus.create('IN_PRODUCTION').getValue().isCancellable(),
      ).toBe(true);
      expect(
        OrderStatus.create('COMPLETED').getValue().isCancellable(),
      ).toBe(false);
    });

    it('requiresAction should flag actionable states', () => {
      expect(
        OrderStatus.create('PENDING_PAYMENT').getValue().requiresAction(),
      ).toBe(true);
      expect(
        OrderStatus.create('INTERNAL_REVIEW').getValue().requiresAction(),
      ).toBe(true);
      expect(
        OrderStatus.create('DISPUTED').getValue().requiresAction(),
      ).toBe(true);
      expect(
        OrderStatus.create('IN_PRODUCTION').getValue().requiresAction(),
      ).toBe(false);
    });
  });

  describe('metadata', () => {
    it('should provide label and color', () => {
      const status = OrderStatus.create('PAID').getValue();
      expect(status.label).toBe('Pagada');
      expect(status.color).toBe('blue');
    });

    it('should serialize to JSON with metadata', () => {
      const status = OrderStatus.draft();
      const json = status.toJSON();

      expect(json.value).toBe('DRAFT');
      expect(json.label).toBe('Borrador');
      expect(json.isTerminal).toBe(false);
      expect(json.allowedTransitions).toContain('PENDING_PAYMENT');
      expect(json.allowedTransitions).toContain('CANCELLED');
    });
  });

  describe('immutability', () => {
    it('transitionTo should return new instance', () => {
      const original = OrderStatus.draft();
      const next = original.transitionTo('PENDING_PAYMENT').getValue();

      expect(original.value).toBe('DRAFT');
      expect(next.value).toBe('PENDING_PAYMENT');
      expect(original).not.toBe(next);
    });
  });

  describe('static utilities', () => {
    it('should list all statuses', () => {
      const all = OrderStatus.allStatuses();
      expect(all).toContain('DRAFT');
      expect(all).toContain('COMPLETED');
      expect(all).toContain('CANCELLED');
      expect(all.length).toBeGreaterThanOrEqual(8);
    });

    it('should list terminal statuses', () => {
      const terminals = OrderStatus.terminalStatuses();
      expect(terminals).toContain('CANCELLED');
      expect(terminals).toContain('REFUNDED');
      expect(terminals).not.toContain('DRAFT');
    });
  });
});
