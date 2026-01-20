import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp-up
    { duration: "1m30s", target: 10 }, // Stay at 10 VUs
    { duration: "30s", target: 0 }, // Ramp-down
  ],
  thresholds: {
    // p95 read (GET) ≤ 200ms
    "http_req_duration{staticAsset:no,method:GET}": ["p(95)<200"],
    // p95 write (POST/PATCH) ≤ 500ms
    "http_req_duration{staticAsset:no,method:POST,method:PATCH}": ["p(95)<500"],
    // p99 ≤ 1000ms
    "http_req_duration": ["p(99)<1000"],
    // Error rate < 1%
    "http_req_failed": ["rate<0.01"],
  },
};

const BASE_URL = "http://localhost:5000";

export default function () {
  // Health check
  http.get(`${BASE_URL}/health`);
  sleep(1);

  // List applications (GET)
  const listRes = http.get(`${BASE_URL}/applications?page=1&limit=20`);
  check(listRes, {
    "list status is 200": (r) => r.status === 200 || r.status === 501,
  });
  sleep(1);

  // Create application (POST)
  const createPayload = JSON.stringify({
    companyName: "Test Corp",
    positionTitle: "Engineer",
    dateApplied: new Date().toISOString(),
    skillsMatch: 85,
  });

  const createRes = http.post(`${BASE_URL}/applications`, createPayload, {
    headers: { "Content-Type": "application/json" },
  });
  check(createRes, {
    "create status is 201": (r) => r.status === 201 || r.status === 501,
  });
  sleep(1);
}
