import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export function setup() {
  const login = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'admin@example.com', password: 'Admin@12345' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  return { token: login.json('token') };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };

  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  const products = http.get(`${BASE_URL}/api/v1/products`, { headers });
  check(products, { 'products ok': (r) => r.status === 200 });

  sleep(1);
}
