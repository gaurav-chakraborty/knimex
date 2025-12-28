#!/usr/bin/env node

const https = require('https');
const http = require('http');

const DOMAIN = process.env.DEPLOY_TARGET || 'localhost:3000';
const IS_LOCAL = DOMAIN.includes('localhost');
const PROTOCOL = IS_LOCAL ? http : https;
const BASE_URL = IS_LOCAL ? `http://${DOMAIN}` : `https://${DOMAIN}`;

console.log('🧪 Running Pre-Deployment Tests');
console.log(`Target: ${BASE_URL}\n`);

const tests = [];

// Test 1: Homepage loads
tests.push(async () => {
  return new Promise((resolve, reject) => {
    const req = (IS_LOCAL ? http : https).get(`${BASE_URL}/`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Homepage loads (200 OK)');
        resolve();
      } else {
        reject(`Homepage returned ${res.statusCode}`);
      }
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject('Timeout'));
  });
});

// Test 2: Health endpoint
tests.push(async () => {
  return new Promise((resolve, reject) => {
    const req = (IS_LOCAL ? http : https).get(`${BASE_URL}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Health endpoint responds (200 OK)');
        resolve();
      } else {
        reject(`Health endpoint returned ${res.statusCode}`);
      }
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject('Timeout'));
  });
});

// Test 3: Keep-alive endpoint (with auth)
tests.push(async () => {
  return new Promise((resolve, reject) => {
    if (!process.env.CRON_SECRET) {
      console.log('⚠️  Keep-alive test skipped (CRON_SECRET not set)');
      resolve();
      return;
    }

    const options = {
      hostname: DOMAIN.split(':')[0],
      port: DOMAIN.split(':')[1] || (IS_LOCAL ? 3000 : 443),
      path: '/api/cron/keep-alive',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    };

    const req = (IS_LOCAL ? http : https).request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Keep-alive endpoint responds (200 OK)');
        resolve();
      } else {
        reject(`Keep-alive returned ${res.statusCode}`);
      }
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject('Timeout'));
    req.end();
  });
});

// Test 4: Database health
tests.push(async () => {
  return new Promise((resolve, reject) => {
    const req = (IS_LOCAL ? http : https).get(`${BASE_URL}/api/db-health`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 503) {
        console.log(`✅ Database health endpoint responds (${res.statusCode})`);
        resolve();
      } else {
        reject(`DB health returned ${res.statusCode}`);
      }
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject('Timeout'));
  });
});

// Run all tests
(async () => {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.log(`❌ Test failed: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed. Fix issues before deploying.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Ready to deploy.');
    process.exit(0);
  }
})();
