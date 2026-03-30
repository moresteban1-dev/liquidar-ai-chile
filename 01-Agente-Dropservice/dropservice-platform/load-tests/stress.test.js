import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { API_URL, authHeaders } from './k6.config.js';

/**
 * STRESS TEST — Find the breaking point
 * Ramps from 0 to 500 VUs
 * Purpose: At what load does the system degrade?
 */

const stressLatency = new Trend('stress_latency', true);
const stressErrors = new Rate('stress_errors');
const requestsCompleted = new Counter('stress_requests_completed');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 400 },
    { duration: '30s', target: 500 },   // Maximum stress
    { duration: '1m', target: 500 },     // Sustain max
    { duration: '30s', target: 200 },    // Recovery
    { duration: '30s', target: 0 },      // Cooldown
  ],
  thresholds: {
    // Stress test has relaxed thresholds — we're finding limits
    http_req_duration: ['p(95)<1000'],   // 1 second under extreme load
    http_req_failed: ['rate<0.05'],      // Up to 5% errors acceptable
    stress_errors: ['rate<0.1'],         // Business errors threshold
  },
  tags: { test_type: 'stress' },
};

export default function () {
  // Simple workload — focus on throughput
  const action = Math.random();

  if (action < 0.5) {
    // Read
    const res = http.get(`${API_URL}/orders?page=1&limit=10`, {
      headers: authHeaders('client'),
      timeout: '10s',
    });
    stressLatency.add(res.timings.duration);
    stressErrors.add(res.status >= 400 ? 1 : 0);
    requestsCompleted.add(1);

  } else if (action < 0.8) {
    // Health (lightweight)
    const res = http.get(`${API_URL}/health`, { timeout: '5s' });
    stressLatency.add(res.timings.duration);
    stressErrors.add(res.status >= 400 ? 1 : 0);
    requestsCompleted.add(1);

  } else {
    // Write
    const payload = JSON.stringify({
      title: `Stress ${Date.now()}`,
      eventType: 'corporate',
      eventDate: '2026-12-01T10:00:00Z',
    });

    const res = http.post(`${API_URL}/orders`, payload, {
      headers: authHeaders('client'),
      timeout: '15s',
    });
    stressLatency.add(res.timings.duration);
    stressErrors.add(res.status >= 400 && res.status !== 429 ? 1 : 0);
    requestsCompleted.add(1);
  }

  sleep(Math.random() * 0.5);
}
