import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_URL, authHeaders, checkResponse } from './k6.config.js';

/**
 * SMOKE TEST — Verify all endpoints are functional
 * VUs: 5 | Duration: 1 minute
 * Purpose: "Does it work at all?"
 */

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  tags: { test_type: 'smoke' },
};

export default function () {
  // ── Health Check ──
  {
    const res = http.get(`${API_URL}/health`);
    check(res, checkResponse(res, 'health'));
  }

  sleep(0.5);

  // ── List Orders (Client) ──
  {
    const res = http.get(`${API_URL}/orders?page=1&limit=10`, {
      headers: authHeaders('client'),
    });
    check(res, checkResponse(res, 'list-orders'));
  }

  sleep(0.5);

  // ── Create Order ──
  {
    const payload = JSON.stringify({
      title: `Smoke Test Event ${Date.now()}`,
      description: 'Automated smoke test order',
      eventType: 'corporate',
      eventDate: '2026-12-01T10:00:00Z',
      estimatedBudget: { amount: 50000, currency: 'MXN' },
      guestCount: 100,
      urgency: 'normal',
    });

    const res = http.post(`${API_URL}/orders`, payload, {
      headers: authHeaders('client'),
    });
    check(res, {
      'create-order: status 201': res.status === 201,
      ...checkResponse(res, 'create-order'),
    });
  }

  sleep(0.5);

  // ── Admin Dashboard ──
  {
    const res = http.get(`${API_URL}/admin/dashboard`, {
      headers: authHeaders('admin'),
    });
    check(res, checkResponse(res, 'admin-dashboard'));
  }

  sleep(0.5);

  // ── Notification Stats ──
  {
    const res = http.get(`${API_URL}/admin/notifications/stats?hours=24`, {
      headers: authHeaders('admin'),
    });
    check(res, checkResponse(res, 'notification-stats'));
  }

  sleep(0.5);

  // ── Cache Stats ──
  {
    const res = http.get(`${API_URL}/admin/cache`, {
      headers: authHeaders('admin'),
    });
    check(res, checkResponse(res, 'cache-stats'));
  }

  sleep(1);
}
