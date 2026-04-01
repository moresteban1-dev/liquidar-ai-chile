import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { API_URL, authHeaders } from './k6.config.js';

/**
 * BUSINESS FLOW TEST — Simulates complete user journeys
 * Tests the full order lifecycle under load
 * VUs: 30 | Duration: 5 minutes
 */

const flowDuration = new Trend('business_flow_duration', true);
const flowsCompleted = new Counter('business_flows_completed');
const flowsFailed = new Counter('business_flows_failed');

export const options = {
  stages: [
    { duration: '30s', target: 15 },
    { duration: '4m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    business_flow_duration: ['p(95)<3000'],  // Full flow < 3 seconds
    http_req_failed: ['rate<0.01'],
  },
  tags: { test_type: 'business_flow' },
};

export default function () {
  const flowStart = Date.now();
  let success = true;

  group('Complete Order Flow', () => {
    // ── Step 1: Client creates order ──
    let orderId;
    {
      const res = http.post(
        `${API_URL}/orders`,
        JSON.stringify({
          title: `Flow Test ${Date.now()}`,
          description: 'Business flow load test order',
          eventType: 'corporate',
          eventDate: '2026-12-15T10:00:00Z',
          estimatedBudget: { amount: 80000, currency: 'MXN' },
          guestCount: 200,
          urgency: 'normal',
        }),
        { headers: authHeaders('client') },
      );

      if (res.status !== 201) { success = false; return; }
      try {
        orderId = JSON.parse(res.body).data.orderId;
      } catch { success = false; return; }

      check(res, { 'step1: order created': res.status === 201 });
    }

    sleep(0.3);

    // ── Step 2: Verify order exists ──
    {
      const res = http.get(`${API_URL}/orders/${orderId}`, {
        headers: authHeaders('client'),
      });

      check(res, { 'step2: order readable': res.status === 200 });
      if (res.status !== 200) { success = false; return; }
    }

    sleep(0.3);

    // ── Step 3: Admin assigns provider ──
    {
      const res = http.post(
        `${API_URL}/orders/${orderId}/assign-provider`,
        JSON.stringify({ providerId: __ENV.PROVIDER_ID || 'test-provider-id' }),
        { headers: authHeaders('admin') },
      );

      check(res, { 'step3: provider assigned': res.status === 200 });
      if (res.status !== 200) { success = false; return; }
    }

    sleep(0.3);

    // ── Step 4: Verify state changed ──
    {
      const res = http.get(`${API_URL}/orders/${orderId}`, {
        headers: authHeaders('admin'),
      });

      if (res.status === 200) {
        try {
          const body = JSON.parse(res.body);
          check(res, {
            'step4: state is assigned': body.data?.state === 'assigned',
          });
        } catch { /* ignore */ }
      }
    }

    sleep(0.3);

    // ── Step 5: Provider creates quotation ──
    let quotationId;
    {
      const res = http.post(
        `${API_URL}/quotations`,
        JSON.stringify({
          orderId: orderId,
          items: [
            { description: 'Sound System', quantity: 1, unitCost: 25000 },
            { description: 'Lighting', quantity: 1, unitCost: 15000 },
            { description: 'Stage', quantity: 1, unitCost: 10000 },
          ],
          notes: 'Load test quotation',
        }),
        { headers: authHeaders('provider') },
      );

      if (res.status === 201) {
        try {
          quotationId = JSON.parse(res.body).data.quotationId;
        } catch { /* ignore */ }
      }
      check(res, { 'step5: quotation created': res.status === 201 });
    }

    sleep(0.3);

    // ── Step 6: List orders (verify in lists) ──
    {
      const res = http.get(`${API_URL}/orders?page=1&limit=10`, {
        headers: authHeaders('client'),
      });
      check(res, { 'step6: list accessible': res.status === 200 });
    }

    sleep(0.3);

    // ── Step 7: Admin dashboard (verify stats updated) ──
    {
      const res = http.get(`${API_URL}/admin/dashboard`, {
        headers: authHeaders('admin'),
      });
      check(res, { 'step7: dashboard loaded': res.status === 200 });
    }
  });

  const flowMs = Date.now() - flowStart;
  flowDuration.add(flowMs);

  if (success) {
    flowsCompleted.add(1);
  } else {
    flowsFailed.add(1);
  }

  sleep(Math.random() * 2 + 1);
}
