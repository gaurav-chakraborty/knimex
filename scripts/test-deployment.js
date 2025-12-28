#!/usr/bin/env node

const https = require('https');
const http = require('http');

const DOMAIN = process.argv[2] || 'knimex.space';
const IS_LOCAL = DOMAIN.includes('localhost');
const BASE_URL = IS_LOCAL ? `http://${DOMAIN}` : `https://${DOMAIN}`;

console.log('🧪 FileX Deployment Test Suite');
console.log(`🎯 Target: ${BASE_URL}\n`);

const tests = [];
let passed = 0;
let failed = 0;

// Helper function
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = IS_LOCAL ? http : https;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (IS_LOCAL ? 3000 : 443),
      path: url.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test 1: Homepage
tests.push({
  name: 'Homepage loads',
  run: async () => {
    const res = await makeRequest('/');
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    console.log('✅ Homepage loads (200 OK)');
  }
});

// Test 2: Health endpoint
tests.push({
  name: 'Health endpoint',
  run: async () => {
    const res = await makeRequest('/api/health');
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    const data = JSON.parse(res.body);
    if (data.status !== 'healthy') {
      throw new Error(`Expected healthy status, got ${data.status}`);
    }
    console.log('✅ Health endpoint responds correctly');
  }
});

// Test 3: Database health
tests.push({
  name: 'Database health',
  run: async () => {
    const res = await makeRequest('/api/db-health');
    if (res.status !== 200 && res.status !== 503) {
      throw new Error(`Expected 200 or 503, got ${res.status}`);
    }
    const data = JSON.parse(res.body);
    console.log(`✅ Database health: ${data.status}`);

    if (data.status === 'degraded' || data.status === 'unhealthy') {
      console.log('   ⚠️  Some checks failed:');
      if (data.checks.errors) {
        data.checks.errors.forEach(err => console.log(`      - ${err}`));
      }
    }
  }
});

// Test 4: Keep-alive endpoint (with auth)
tests.push({
  name: 'Keep-alive endpoint',
  run: async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.log('⚠️  Keep-alive test skipped (CRON_SECRET not set)');
      return;
    }

    const res = await makeRequest('/api/cron/keep-alive', {
      headers: { 'Authorization': `Bearer ${secret}` }
    });

    if (res.status !== 200) {
      const data = JSON.parse(res.body);
      throw new Error(`Expected 200, got ${res.status}: ${data.error || data.message}`);
    }

    const data = JSON.parse(res.body);
    if (!data.success) {
      throw new Error(`Keep-alive failed: ${data.error || data.message}`);
    }

    console.log(`✅ Keep-alive endpoint works (${data.responseTime})`);
  }
});

// Test 5: Keep-alive without auth (should fail)
tests.push({
  name: 'Keep-alive auth required',
  run: async () => {
    const res = await makeRequest('/api/cron/keep-alive');
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    }
    console.log('✅ Keep-alive requires authorization (401)');
  }
});

// Run all tests
(async () => {
  for (const test of tests) {
    try {
      await test.run();
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed. Review errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Deployment verified.');
    process.exit(0);
  }
})();
