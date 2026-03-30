/**
 * Shared k6 configuration and thresholds.
 * All test scripts import from here to ensure consistency.
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_URL = `${BASE_URL}/api`;

// Auth tokens (set via environment)
export const AUTH_TOKENS = {
  admin: __ENV.ADMIN_TOKEN || '',
  provider: __ENV.PROVIDER_TOKEN || '',
  client: __ENV.CLIENT_TOKEN || '',
};

// Standard thresholds applied to all tests
export const STANDARD_THRESHOLDS = {
  http_req_duration: [
    'p(50)<100',   // 50th percentile < 100ms
    'p(95)<200',   // 95th percentile < 200ms
    'p(99)<500',   // 99th percentile < 500ms
  ],
  http_req_failed: ['rate<0.001'],  // < 0.1% error rate
  http_reqs: ['rate>50'],           // > 50 req/s minimum
};

// Stricter thresholds for critical paths
export const CRITICAL_THRESHOLDS = {
  http_req_duration: [
    'p(50)<50',
    'p(95)<150',
    'p(99)<300',
  ],
  http_req_failed: ['rate<0.0005'],  // < 0.05%
};

// Headers helper
export function authHeaders(role) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKENS[role]}`,
  };
}

// Response validator
export function checkResponse(res, name) {
  const checks = {};
  checks[`${name}: status 2xx`] = res.status >= 200 && res.status < 300;
  checks[`${name}: has body`] = res.body && res.body.length > 0;

  try {
    const body = JSON.parse(res.body);
    checks[`${name}: success=true`] = body.success === true;
  } catch {
    checks[`${name}: valid JSON`] = false;
  }

  return checks;
}
