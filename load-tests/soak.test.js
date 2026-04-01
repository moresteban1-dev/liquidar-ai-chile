import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Gauge } from 'k6/metrics';
import { API_URL, authHeaders, checkResponse } from './k6.config.js';

/**
 * SOAK TEST — Long-running stability test
 * VUs: 50 | Duration: 2 hours
 * Purpose: Detect memory leaks, connection pool exhaustion, cache bloat
 */

const soakLatency = new Trend('soak_latency', true);
const soakErrors = new Rate('soak_errors');
const soakP95Trend = new Trend('soak_p95_over_time', true);

export const options = {
  stages: [
    { duration: '2m', target: 50 },      // Ramp up
    { duration: '116m', target: 50 },     // Sustained (1h 56min)
    { duration: '2m', target: 0 },        // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'],    // Consistent over time
    http_req_failed: ['rate<0.001'],     // Very low error rate
    soak_errors: ['rate<0.002'],
  },
  tags: { test_type: 'soak' },
};

const ORDER_IDS = [];

export default function () {
  const actions = [
    { weight: 40, fn: listOrders },
    { weight: 25, fn: readOrder },
    { weight: 15, fn: createOrder },
    { weight: 10, fn: dashboard },
    { weight: 5, fn: cacheStats },
    { weight: 5, fn: health },
  ];

  const totalWeight = actions.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * totalWeight;
  for (const a of actions) {
    r -= a.weight;
    if (r <= 0) { a.fn(); break; }
  }

  sleep(Math.random() * 2 + 1);
}

function listOrders() {
  const page = Math.floor(Math.random() * 10) + 1;
  const res = http.get(`${API_URL}/orders?page=${page}&limit=20`, {
    headers: authHeaders('client'),
  });

  soakLatency.add(res.timings.duration);
  soakP95Trend.add(res.timings.duration);
  soakErrors.add(res.status >= 400 ? 1 : 0);

  try {
    const body = JSON.parse(res.body);
    if (body.data?.orders) {
      for (const o of body.data.orders.slice(0, 2)) {
        if (ORDER_IDS.length < 200) ORDER_IDS.push(o.id);
      }
    }
  } catch { /* ignore */ }
}

function readOrder() {
  if (ORDER_IDS.length === 0) { listOrders(); return; }
  const id = ORDER_IDS[Math.floor(Math.random() * ORDER_IDS.length)];

  const res = http.get(`${API_URL}/orders/${id}`, {
    headers: authHeaders('client'),
  });

  soakLatency.add(res.timings.duration);
  soakErrors.add(res.status >= 400 && res.status !== 404 ? 1 : 0);
}

function createOrder() {
  const payload = JSON.stringify({
    title: `Soak Test ${Date.now()}`,
    eventType: ['corporate', 'social', 'wedding'][Math.floor(Math.random() * 3)],
    eventDate: new Date(Date.now() + 86400000 * (30 + Math.random() * 300)).toISOString(),
    guestCount: Math.floor(Math.random() * 300) + 10,
  });

  const res = http.post(`${API_URL}/orders`, payload, {
    headers: authHeaders('client'),
  });

  soakLatency.add(res.timings.duration);
  soakErrors.add(res.status !== 201 ? 1 : 0);

  try {
    const body = JSON.parse(res.body);
    if (body.data?.orderId && ORDER_IDS.length < 500) {
      ORDER_IDS.push(body.data.orderId);
    }
  } catch { /* ignore */ }
}

function dashboard() {
  const res = http.get(`${API_URL}/admin/dashboard`, {
    headers: authHeaders('admin'),
  });

  soakLatency.add(res.timings.duration);
  soakErrors.add(res.status >= 400 ? 1 : 0);
}

function cacheStats() {
  const res = http.get(`${API_URL}/admin/cache`, {
    headers: authHeaders('admin'),
  });

  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      const stats = body.data?.stats;
      if (stats) {
        // Log cache health periodically
        console.log(`[SOAK] Cache: size=${stats.size} hitRate=${(stats.hitRate * 100).toFixed(1)}% mem=${stats.memoryEstimateMB}MB`);
      }
    } catch { /* ignore */ }
  }
}

function health() {
  const res = http.get(`${API_URL}/health`);
  check(res, { 'health ok': res.status === 200 });
}
