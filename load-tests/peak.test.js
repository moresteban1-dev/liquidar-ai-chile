import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { API_URL, authHeaders, checkResponse } from './k6.config.js';

/**
 * PEAK LOAD TEST — Simulates traffic spike (e.g. marketing campaign)
 * VUs: 200 | Duration: 5 minutes
 * Purpose: Can we handle 4x normal traffic?
 */

const peakLatency = new Trend('peak_latency', true);
const peakErrors = new Rate('peak_errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // Fast ramp
    { duration: '3m', target: 200 },     // Peak sustained
    { duration: '1m', target: 50 },      // Recovery
    { duration: '30s', target: 0 },      // Cooldown
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.005'],    // < 0.5% errors allowed under peak
    peak_errors: ['rate<0.01'],
  },
  tags: { test_type: 'peak' },
};

const ORDER_IDS = [];

export default function () {
  const actions = [
    { weight: 40, fn: readOrder },
    { weight: 30, fn: listOrders },
    { weight: 15, fn: createOrder },
    { weight: 10, fn: dashboard },
    { weight: 5, fn: health },
  ];

  const totalWeight = actions.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * totalWeight;
  for (const action of actions) {
    r -= action.weight;
    if (r <= 0) { action.fn(); break; }
  }

  sleep(Math.random() * 1.5 + 0.3);
}

function listOrders() {
  group('Peak: List Orders', () => {
    const res = http.get(`${API_URL}/orders?page=1&limit=20`, {
      headers: authHeaders('client'),
    });
    peakLatency.add(res.timings.duration);

    const ok = check(res, checkResponse(res, 'peak-list'));
    if (!ok) peakErrors.add(1);
    else peakErrors.add(0);

    try {
      const body = JSON.parse(res.body);
      if (body.data?.orders) {
        for (const o of body.data.orders.slice(0, 2)) {
          if (ORDER_IDS.length < 50) ORDER_IDS.push(o.id);
        }
      }
    } catch { /* ignore */ }
  });
}

function readOrder() {
  group('Peak: Read Order', () => {
    if (ORDER_IDS.length === 0) { listOrders(); return; }

    const id = ORDER_IDS[Math.floor(Math.random() * ORDER_IDS.length)];
    const res = http.get(`${API_URL}/orders/${id}`, {
      headers: authHeaders('client'),
    });
    peakLatency.add(res.timings.duration);

    if (res.status !== 200 && res.status !== 404) peakErrors.add(1);
    else peakErrors.add(0);
  });
}

function createOrder() {
  group('Peak: Create Order', () => {
    const payload = JSON.stringify({
      title: `Peak Test ${Date.now()}`,
      eventType: 'corporate',
      eventDate: '2026-12-15T10:00:00Z',
      guestCount: 100,
    });

    const res = http.post(`${API_URL}/orders`, payload, {
      headers: authHeaders('client'),
    });
    peakLatency.add(res.timings.duration);

    if (res.status !== 201) peakErrors.add(1);
    else {
      peakErrors.add(0);
      try {
        const body = JSON.parse(res.body);
        if (body.data?.orderId && ORDER_IDS.length < 100) {
          ORDER_IDS.push(body.data.orderId);
        }
      } catch { /* ignore */ }
    }
  });
}

function dashboard() {
  group('Peak: Dashboard', () => {
    const res = http.get(`${API_URL}/admin/dashboard`, {
      headers: authHeaders('admin'),
    });
    peakLatency.add(res.timings.duration);

    if (res.status !== 200) peakErrors.add(1);
    else peakErrors.add(0);
  });
}

function health() {
  group('Peak: Health', () => {
    const res = http.get(`${API_URL}/health`);
    check(res, { 'health ok': res.status === 200 });
  });
}
