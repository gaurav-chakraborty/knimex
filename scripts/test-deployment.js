const https = require("https");
const http = require("http");

const target = process.env.DEPLOYMENT_URL || process.argv[2] || "http://localhost:3000";
const BASE_URL = new URL(/^https?:\/\//i.test(target) ? target : `${target.includes("localhost") ? "http" : "https"}://${target}`);
const IS_LOCAL = BASE_URL.protocol === "http:";

console.log("FileX deployment verification");
console.log(`Target: ${BASE_URL.origin}\n`);

const tests = [];
let passed = 0;
let failed = 0;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = IS_LOCAL ? http : https;
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (IS_LOCAL ? 80 : 443),
      path: `${url.pathname}${url.search}`,
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: 10000,
    };

    const request = protocol.request(requestOptions, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });

    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
    request.end();
  });
}

function parseJson(body) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Expected a JSON response");
  }
}

tests.push({
  name: "Homepage loads",
  run: async () => {
    const response = await makeRequest("/");
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    console.log("PASS homepage loads (200)");
  },
});

tests.push({
  name: "Health endpoint",
  run: async () => {
    const response = await makeRequest("/api/health");
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    const data = parseJson(response.body);
    if (!data.status || !["healthy", "degraded"].includes(data.status)) {
      throw new Error(`Unexpected health status: ${data.status}`);
    }
    console.log(`PASS health endpoint (${data.status})`);
  },
});

tests.push({
  name: "Database health",
  run: async () => {
    const response = await makeRequest("/api/db-health");
    if (![200, 503].includes(response.status)) throw new Error(`Expected 200 or 503, got ${response.status}`);
    const data = parseJson(response.body);
    if (!["healthy", "degraded", "unhealthy", "error"].includes(data.status)) {
      throw new Error(`Unexpected database status: ${data.status}`);
    }
    console.log(`PASS database health endpoint (${data.status})`);
  },
});

tests.push({
  name: "Keep-alive endpoint",
  run: async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.log("SKIP keep-alive authenticated check (CRON_SECRET not set)");
      return;
    }

    const response = await makeRequest("/api/cron/keep-alive", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = parseJson(response.body);
    if (response.status !== 200 || !data.success) {
      throw new Error(`Expected healthy keep-alive, got ${response.status}: ${data.error || data.message}`);
    }
    console.log(`PASS keep-alive endpoint (${data.responseTime})`);
  },
});

tests.push({
  name: "Keep-alive auth required",
  run: async () => {
    const response = await makeRequest("/api/cron/keep-alive");
    if (response.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${response.status}`);
    console.log("PASS keep-alive rejects unauthenticated requests");
  },
});

(async () => {
  for (const test of tests) {
    try {
      await test.run();
      passed += 1;
    } catch (error) {
      console.error(`FAIL ${test.name}: ${error instanceof Error ? error.message : error}`);
      failed += 1;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
