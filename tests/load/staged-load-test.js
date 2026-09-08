import http from 'k6/http';
import {check} from 'k6';
import exec from 'k6/execution';

const ORIGIN = __ENV.TARGET_URL || 'https://www.encumbrate.es';

export const options = {
  discardResponseBodies: true,
  scenarios: {
    users_100: {executor: 'per-vu-iterations', vus: 100, iterations: 1, maxDuration: '40s', startTime: '0s', tags: {stage: '100'}},
    users_250: {executor: 'per-vu-iterations', vus: 250, iterations: 1, maxDuration: '40s', startTime: '45s', tags: {stage: '250'}},
    users_500: {executor: 'per-vu-iterations', vus: 500, iterations: 1, maxDuration: '40s', startTime: '90s', tags: {stage: '500'}},
    users_1000: {executor: 'per-vu-iterations', vus: 1000, iterations: 1, maxDuration: '40s', startTime: '135s', tags: {stage: '1000'}},
  },
  thresholds: {
    'http_req_failed{endpoint:page}': ['rate<0.01'],
    'http_req_duration{endpoint:page}': ['p(95)<2000'],
  },
};

export default function () {
  const stage = exec.scenario.name.replace('users_', '');
  const page = http.get(`${ORIGIN}/`, {tags: {endpoint: 'page', stage}});
  check(page, {'portada responde 200': response => response.status === 200});

  const routes = http.get(`${ORIGIN}/api/routes?limit=3`, {tags: {endpoint: 'routes', stage}});
  check(routes, {
    'API responde de forma controlada': response => response.status === 200 || response.status === 429,
    'API no devuelve error 5xx': response => response.status < 500,
  });
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `\nResultado completo guardado en load-test-results.json\n`,
  };
}
