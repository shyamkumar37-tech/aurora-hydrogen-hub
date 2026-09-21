import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp up to 20 users
    { duration: '30s', target: 20 }, // Stay at 20 users
    { duration: '10s', target: 0 },  // Ramp down
  ],
};

export default function () {
  const res = await http.get('http://localhost:5000/api/stations');
  
  check(res, {
    'is status 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
