// backend/test/api.test.js - API Test Suite
const axios = require('axios');

// Configure this to point to your backend
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

// Test results tracker
let passed = 0;
let failed = 0;
let testResults = [];

// Helper function to run a test
async function test(name, fn) {
  try {
    await fn();
    passed++;
    log.success(name);
    testResults.push({ name, status: 'PASS' });
  } catch (error) {
    failed++;
    log.error(`${name}: ${error.message}`);
    testResults.push({ name, status: 'FAIL', error: error.message });
  }
}

// Assertion helpers
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertExists(value, message) {
  if (!value) {
    throw new Error(message || 'Value should exist');
  }
}

function assertArray(value, message) {
  if (!Array.isArray(value)) {
    throw new Error(message || 'Value should be an array');
  }
}

function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
  }
}

// ==================== TESTS ====================

async function runTests() {
  console.log(`\n${colors.blue}${'='.repeat(60)}`);
  console.log(`Running API Tests for: ${API_URL}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);

  // Health Check Tests
  console.log(`\n${colors.yellow}=== Health Check Tests ===${colors.reset}\n`);

  await test('GET /health - Should return 200', async () => {
    const response = await axios.get(`${API_URL}/health`);
    assertEquals(response.status, 200, 'Status should be 200');
    assertEquals(response.data.status, 'ok', 'Status should be ok');
    assertExists(response.data.timestamp, 'Timestamp should exist');
  });

  await test('GET /health - Should have database connection', async () => {
    const response = await axios.get(`${API_URL}/health`);
    assertExists(response.data.database, 'Database status should exist');
  });

  // Banks API Tests
  console.log(`\n${colors.yellow}=== Banks API Tests ===${colors.reset}\n`);

  let bankId;

  await test('GET /api/banks - Should return array of banks', async () => {
    const response = await axios.get(`${API_URL}/api/banks`);
    assertEquals(response.status, 200, 'Status should be 200');
    assertArray(response.data, 'Response should be an array');
    assertGreaterThan(response.data.length, 0, 'Should have at least one bank');
  });

  await test('GET /api/banks - Should have required bank fields', async () => {
    const response = await axios.get(`${API_URL}/api/banks`);
    const bank = response.data[0];
    assertExists(bank.id, 'Bank should have id');
    assertExists(bank.name, 'Bank should have name');
    assertExists(bank.website, 'Bank should have website');
    assertExists(bank.created_at, 'Bank should have created_at');
    bankId = bank.id; // Save for later tests
  });

  await test('GET /api/banks - Should have all major NZ banks', async () => {
    const response = await axios.get(`${API_URL}/api/banks`);
    const bankNames = response.data.map(b => b.name);
    const requiredBanks = ['ANZ', 'ASB', 'BNZ', 'Westpac', 'Kiwibank'];
    requiredBanks.forEach(name => {
      if (!bankNames.includes(name)) {
        throw new Error(`Missing required bank: ${name}`);
      }
    });
  });

  // Rates API Tests
  console.log(`\n${colors.yellow}=== Rates API Tests ===${colors.reset}\n`);

  await test('GET /api/rates - Should return array of rates', async () => {
    const response = await axios.get(`${API_URL}/api/rates`);
    assertEquals(response.status, 200, 'Status should be 200');
    assertArray(response.data, 'Response should be an array');
  });

  await test('GET /api/rates - Should have required rate fields', async () => {
    const response = await axios.get(`${API_URL}/api/rates`);
    if (response.data.length > 0) {
      const rate = response.data[0];
      assertExists(rate.id, 'Rate should have id');
      assertExists(rate.bank_id, 'Rate should have bank_id');
      assertExists(rate.bank_name, 'Rate should have bank_name');
      assertExists(rate.rate_date, 'Rate should have rate_date');
    }
  });

  await test('GET /api/rates/latest - Should return latest rates for all banks', async () => {
    const response = await axios.get(`${API_URL}/api/rates/latest`);
    assertEquals(response.status, 200, 'Status should be 200');
    assertArray(response.data, 'Response should be an array');
  });

  await test('GET /api/rates/best/term_1year - Should return rates sorted by 1 year term', async () => {
    const response = await axios.get(`${API_URL}/api/rates/best/term_1year`);
    assertEquals(response.status, 200, 'Status should be 200');
    assertArray(response.data, 'Response should be an array');
  });

  await test('GET /api/rates/best/invalid - Should return 400 for invalid term', async () => {
    try {
      await axios.get(`${API_URL}/api/rates/best/invalid_term`);
      throw new Error('Should have returned 400');
    } catch (error) {
      if (error.response) {
        assertEquals(error.response.status, 400, 'Should return 400');
      } else {
        throw error;
      }
    }
  });

  // POST Rate Tests
  console.log(`\n${colors.yellow}=== POST Rate Tests ===${colors.reset}\n`);

  let createdRateId;

  await test('POST /api/rates - Should create a new rate', async () => {
    const testRate = {
      bank_id: bankId,
      rate_date: '2026-02-15',
      term_1year: 4.99,
      term_2year: 5.29,
      term_3year: 5.59,
      term_5year: 5.89
    };
    const response = await axios.post(`${API_URL}/api/rates`, testRate);
    assertEquals(response.status, 201, 'Status should be 201');
    assertExists(response.data.id, 'Created rate should have id');
    createdRateId = response.data.id;
  });

  await test('POST /api/rates - Should require bank_id and rate_date', async () => {
    try {
      await axios.post(`${API_URL}/api/rates`, { term_1year: 5.0 });
      throw new Error('Should have returned 400');
    } catch (error) {
      if (error.response) {
        assertEquals(error.response.status, 400, 'Should return 400');
      } else {
        throw error;
      }
    }
  });

  await test('POST /api/rates - Should update existing rate on duplicate date', async () => {
    const updateRate = {
      bank_id: bankId,
      rate_date: '2026-02-15',
      term_1year: 5.19,
      term_2year: 5.49,
      term_3year: 5.79,
      term_5year: 6.09
    };
    const response = await axios.post(`${API_URL}/api/rates`, updateRate);
    assertEquals(response.status, 201, 'Status should be 201');
  });

  // Bulk Insert Tests
  console.log(`\n${colors.yellow}=== Bulk Insert Tests ===${colors.reset}\n`);

  await test('POST /api/rates/bulk - Should insert multiple rates', async () => {
    const bulkRates = {
      rates: [
        {
          bank_id: bankId,
          rate_date: '2026-02-16',
          term_1year: 4.89,
          term_2year: 5.19,
          term_3year: 5.49,
          term_5year: 5.79
        },
        {
          bank_id: bankId,
          rate_date: '2026-02-17',
          term_1year: 4.79,
          term_2year: 5.09,
          term_3year: 5.39,
          term_5year: 5.69
        }
      ]
    };
    const response = await axios.post(`${API_URL}/api/rates/bulk`, bulkRates);
    assertEquals(response.status, 201, 'Status should be 201');
    assertExists(response.data.count, 'Response should have count');
    assertGreaterThan(response.data.count, 0, 'Should have inserted rates');
  });

  await test('POST /api/rates/bulk - Should require rates array', async () => {
    try {
      await axios.post(`${API_URL}/api/rates/bulk`, {});
      throw new Error('Should have returned 400');
    } catch (error) {
      if (error.response) {
        assertEquals(error.response.status, 400, 'Should return 400');
      } else {
        throw error;
      }
    }
  });

  // Query Filter Tests
  console.log(`\n${colors.yellow}=== Query Filter Tests ===${colors.reset}\n`);

  await test('GET /api/rates?bank_id=X - Should filter by bank_id', async () => {
    const response = await axios.get(`${API_URL}/api/rates?bank_id=${bankId}`);
    assertEquals(response.status, 200, 'Status should be 200');
    response.data.forEach(rate => {
      assertEquals(rate.bank_id, bankId, 'All rates should be for specified bank');
    });
  });

  await test('GET /api/rates?start_date=X&end_date=Y - Should filter by date range', async () => {
    const response = await axios.get(`${API_URL}/api/rates?start_date=2026-02-01&end_date=2026-02-28`);
    assertEquals(response.status, 200, 'Status should be 200');
    assertArray(response.data, 'Response should be an array');
  });

  // CORS Tests
  console.log(`\n${colors.yellow}=== CORS Tests ===${colors.reset}\n`);

  await test('OPTIONS /api/banks - Should allow CORS', async () => {
    const response = await axios.options(`${API_URL}/api/banks`);
    // CORS headers should be present
    assertEquals(response.status, 204, 'Status should be 204');
  });

  // Error Handling Tests
  console.log(`\n${colors.yellow}=== Error Handling Tests ===${colors.reset}\n`);

  await test('GET /api/nonexistent - Should return 404', async () => {
    try {
      await axios.get(`${API_URL}/api/nonexistent`);
      throw new Error('Should have returned 404');
    } catch (error) {
      if (error.response) {
        assertEquals(error.response.status, 404, 'Should return 404');
      } else {
        throw error;
      }
    }
  });

  // Performance Tests
  console.log(`\n${colors.yellow}=== Performance Tests ===${colors.reset}\n`);

  await test('GET /api/rates - Should respond within 2 seconds', async () => {
    const start = Date.now();
    await axios.get(`${API_URL}/api/rates`);
    const duration = Date.now() - start;
    if (duration > 2000) {
      throw new Error(`Response took ${duration}ms, expected < 2000ms`);
    }
  });

  await test('GET /api/banks - Should respond within 1 second', async () => {
    const start = Date.now();
    await axios.get(`${API_URL}/api/banks`);
    const duration = Date.now() - start;
    if (duration > 1000) {
      throw new Error(`Response took ${duration}ms, expected < 1000ms`);
    }
  });

  // Print Results
  console.log(`\n${colors.blue}${'='.repeat(60)}`);
  console.log(`Test Results`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);

  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failed > 0) {
    console.log(`${colors.red}Failed Tests:${colors.reset}`);
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    console.log('');
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal Error: ${error.message}${colors.reset}`);
  process.exit(1);
});