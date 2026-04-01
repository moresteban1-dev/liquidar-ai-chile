import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import {
  API_URL,
  authHeaders,
  checkResponse,
  STANDARD_THRESHOLDS,
} from './k6.config.js';

/**
 * NORMAL LOAD TEST — Baseline production traffic
 * VUs: 50 | Duration: 10 minutes
 * Simulates typical day: 70% reads, 20% list, 10% writes
 */

// Custom metrics
const orderCreateDuration = new Trend('order_create_duration', true);
const orderListDuration = new Trend('order_list_duration', true);
const dashboardDuration = new Trend('dashboard_duration', true);
const orderDetailDuration = new Trend('order_detail_duration', true);
const errorRate = new Rate('business_errors');
const ordersCreated = new Counter('orders_created');

export const options = {
  stages: [
    { duration: '1m', target: 25 },    // Ramp up
    { duration: '8m', target: 50 },    // Sustained load
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    ...STANDARD_THRESHOLDS,
    order_create_duration: ['p(95)<300'],
    order_list_duration: ['p(95)<150'],
    dashboard_duration: ['p(95)<200'],
    order_detail_duration: ['p(95)<150'],
    business_errors: ['rate<0.005'],
  },
  tags: { test_type: 'normal' },
};

// Test data pool
const ORDER_IDS = [];
const EVENT_TYPES = ['corporate', 'social', 'wedding', 'conference', 'festival'];

export default function () {
  const scenario = weightedRandom([
    { weight: 35, fn: listOrders },
    { weight: 25, fn: getOrderDetail },
    { weight: 15, fn: createOrder },
    { weight: 10, fn: adminDashboard },
    { weight: 5, fn: listQuotations },
    { weight: 5, fn: notificationStats },
    { weight: 5, fn: healthCheck },
  ]);

  scenario();
  sleep(randomBetween(0.5, 2));
}

function listOrders() {
  group('List Orders', () => {
    const page = Math.floor(Math.random() * 5) + 1;
    const status = Math.random() > 0.5
      ? EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
      : '';

    const url = `${API_URL}/orders?page=${page}&limit=20${status ? `&status=${status}` : ''}`;
    const res = http.get(url, { headers: authHeaders('client') });

    orderListDuration.add(res.timings.duration);
    check(res, checkResponse(res, 'list-orders'));

    // Collect order IDs for detail tests
    try {
      const body = JSON.parse(res.body);
      if (body.data?.orders) {
        for (const order of body.data.orders.slice(0, 3)) {
          if (ORDER_IDS.length < 100) ORDER_IDS.push(order.id);
        }
      }
    } catch { /* ignore */ }
  });
}

function getOrderDetail() {
  group('Order Detail', () => {
    if (ORDER_IDS.length === 0) {
      listOrders(); // Seed IDs first
      return;
    }

    const orderId = ORDER_IDS[Math.floor(Math.random() * ORDER_IDS.length)];
    const res = http.get(`${API_URL}/orders/${orderId}`, {
      headers: authHeaders('client'),
    });

    orderDetailDuration.add(res.timings.duration);

    const checks = checkResponse(res, 'order-detail');
    if (res.status === 404) {
      checks['order-detail: found'] = false;
      errorRate.add(1);
    } else {
      check(res, checks);
      errorRate.add(0);
    }
  });
}

function createOrder() {
  group('Create Order', () => {
    const payload = JSON.stringify({
      title: `Load Test Event ${Date.now()}-${Math.random().toString(36).slice(2)}`,
      description: 'Created during load testing',
      eventType: EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)],
      eventDate: randomFutureDate(),
      estimatedBudget: {
        amount: Math.floor(Math.random() * 200000) + 10000,
        currency: 'MXN',
      },
      guestCount: Math.floor(Math.random() * 500) + 10,
      urgency: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
    });

    const res = http.post(`${API_URL}/orders`, payload, {
      headers: authHeaders('client'),
    });

    orderCreateDuration.add(res.timings.duration);

    if (res.status === 201) {
      ordersCreated.add(1);
      try {
        const body = JSON.parse(res.body);
        if (body.data?.orderId && ORDER_IDS.length < 200) {
          ORDER_IDS.push(body.data.orderId);
        }
      } catch { /* ignore */ }
    }

    check(res, {
      'create-order: status 201': res.status === 201,
    });
  });
}

function adminDashboard() {
  group('Admin Dashboard', () => {
    const res = http.get(`${API_URL}/admin/dashboard`, {
      headers: authHeaders('admin'),
    });

    dashboardDuration.add(res.timings.duration);
    check(res, checkResponse(res, 'admin-dashboard'));
  });
}

function listQuotations() {
  group('List Quotations', () => {
    if (ORDER_IDS.length === 0) return;

    const orderId = ORDER_IDS[Math.floor(Math.random() * ORDER_IDS.length)];
    const res = http.get(`${API_URL}/orders/${orderId}/quotations`, {
      headers: authHeaders('admin'),
    });

    check(res, checkResponse(res, 'list-quotations'));
  });
}

function notificationStats() {
  group('Notification Stats', () => {
    const res = http.get(`${API_URL}/admin/notifications/stats?hours=24`, {
      headers: authHeaders('admin'),
    });

    check(res, checkResponse(res, 'notification-stats'));
  });
}

function healthCheck() {
  group('Health Check', () => {
    const res = http.get(`${API_URL}/health`);
    check(res, { 'health: status 200': res.status === 200 });
  });
}

// ── Helpers ──

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.fn;
  }

  return items[items.length - 1].fn;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomFutureDate() {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 365) + 30);
  return date.toISOString();
}
