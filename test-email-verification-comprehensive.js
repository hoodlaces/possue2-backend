#!/usr/bin/env node

/**
 * Comprehensive test suite for the enhanced email verification system
 * Tests all aspects of registration, email sending, and verification
 */

const crypto = require('crypto');

// Test configuration
const BASE_URL = 'http://localhost:1337';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_USERNAME = `testuser_${Date.now()}`;
const TEST_PASSWORD = 'SecureTestPassword123!';

let createdUserId = null;
let confirmationToken = null;

/**
 * Make HTTP request with error handling
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? require('https') : require('http');
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null,
            rawData: data
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test 1: Registration with valid data
 */
async function testRegistration() {
  console.log('\n🔍 Test 1: User Registration');
  console.log('=============================');

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      })
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Registration successful');
      if (response.data && response.data.user) {
        createdUserId = response.data.user.id;
        console.log(`User ID: ${createdUserId}`);
      }
      return true;
    } else {
      console.log('❌ Registration failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Registration test error:', error.message);
    return false;
  }
}

/**
 * Test 2: Check user verification status
 */
async function testVerificationStatus() {
  console.log('\n🔍 Test 2: Check Verification Status');
  console.log('====================================');

  try {
    const response = await makeRequest(`${BASE_URL}/api/debug/verification/status/${encodeURIComponent(TEST_EMAIL)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);

    if (response.status === 200 && response.data && response.data.status) {
      const status = response.data.status;
      console.log(`✅ User found: ${status.email}`);
      console.log(`Confirmed: ${status.confirmed}`);
      console.log(`Has pending token: ${status.hasPendingToken}`);
      console.log(`Token expired: ${status.tokenExpired}`);
      return true;
    } else {
      console.log('❌ Failed to get verification status');
      return false;
    }
  } catch (error) {
    console.error('❌ Verification status test error:', error.message);
    return false;
  }
}

/**
 * Test 3: Check overall verification statistics
 */
async function testVerificationStats() {
  console.log('\n🔍 Test 3: Check Verification Statistics');
  console.log('=======================================');

  try {
    const response = await makeRequest(`${BASE_URL}/api/debug/verification/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);

    if (response.status === 200 && response.data && response.data.stats) {
      const stats = response.data.stats;
      console.log('✅ Statistics retrieved successfully');
      console.log(`Total users: ${stats.totalUsers}`);
      console.log(`Confirmed users: ${stats.confirmedUsers}`);
      console.log(`Unconfirmed users: ${stats.unconfirmedUsers}`);
      console.log(`Confirmation rate: ${stats.confirmationRate}%`);
      return true;
    } else {
      console.log('❌ Failed to get verification stats');
      return false;
    }
  } catch (error) {
    console.error('❌ Verification stats test error:', error.message);
    return false;
  }
}

/**
 * Test 4: Test duplicate registration (should fail)
 */
async function testDuplicateRegistration() {
  console.log('\n🔍 Test 4: Duplicate Registration (Should Fail)');
  console.log('===============================================');

  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        username: TEST_USERNAME + '_dup',
        password: TEST_PASSWORD
      })
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);

    if (response.status === 400) {
      console.log('✅ Duplicate email correctly rejected');
      return true;
    } else {
      console.log('❌ Duplicate email was not rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ Duplicate registration test error:', error.message);
    return false;
  }
}

/**
 * Test 5: Test email confirmation with invalid token
 */
async function testInvalidEmailConfirmation() {
  console.log('\n🔍 Test 5: Invalid Email Confirmation Token');
  console.log('===========================================');

  try {
    const fakeToken = crypto.randomBytes(32).toString('hex');
    const response = await makeRequest(`${BASE_URL}/api/auth/email-confirmation?confirmation=${fakeToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);

    if (response.status === 400) {
      console.log('✅ Invalid token correctly rejected');
      return true;
    } else {
      console.log('❌ Invalid token was not rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ Invalid token test error:', error.message);
    return false;
  }
}

/**
 * Test 6: Test resending verification email
 */
async function testResendVerification() {
  console.log('\n🔍 Test 6: Resend Verification Email');
  console.log('===================================');

  try {
    const response = await makeRequest(`${BASE_URL}/api/debug/verification/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);

    if (response.status === 200) {
      console.log('✅ Verification email resent successfully');
      return true;
    } else {
      console.log('❌ Failed to resend verification email');
      return false;
    }
  } catch (error) {
    console.error('❌ Resend verification test error:', error.message);
    return false;
  }
}

/**
 * Test 7: Test rate limiting by making multiple requests
 */
async function testRateLimiting() {
  console.log('\n🔍 Test 7: Rate Limiting Test');
  console.log('=============================');

  try {
    let successCount = 0;
    let rateLimitedCount = 0;

    // Make 8 registration attempts (should hit rate limit)
    for (let i = 0; i < 8; i++) {
      const testEmail = `ratetest${i}_${Date.now()}@example.com`;
      const response = await makeRequest(`${BASE_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          username: `ratetest${i}_${Date.now()}`,
          password: TEST_PASSWORD
        })
      });

      if (response.status === 429) {
        rateLimitedCount++;
        console.log(`Request ${i + 1}: Rate limited ✅`);
      } else if (response.status === 200 || response.status === 201) {
        successCount++;
        console.log(`Request ${i + 1}: Success`);
      } else {
        console.log(`Request ${i + 1}: Other error (${response.status})`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Success count: ${successCount}, Rate limited: ${rateLimitedCount}`);
    
    if (rateLimitedCount > 0) {
      console.log('✅ Rate limiting is working');
      return true;
    } else {
      console.log('⚠️  Rate limiting may not be working as expected');
      return false;
    }
  } catch (error) {
    console.error('❌ Rate limiting test error:', error.message);
    return false;
  }
}

/**
 * Test 8: Test cleanup expired tokens
 */
async function testCleanupExpiredTokens() {
  console.log('\n🔍 Test 8: Cleanup Expired Tokens');
  console.log('=================================');

  try {
    const response = await makeRequest(`${BASE_URL}/api/debug/verification/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);

    if (response.status === 200) {
      console.log('✅ Cleanup executed successfully');
      return true;
    } else {
      console.log('❌ Failed to cleanup expired tokens');
      return false;
    }
  } catch (error) {
    console.error('❌ Cleanup test error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 COMPREHENSIVE EMAIL VERIFICATION TEST SUITE');
  console.log('===============================================');
  console.log(`Test email: ${TEST_EMAIL}`);
  console.log(`Test username: ${TEST_USERNAME}`);
  console.log(`Base URL: ${BASE_URL}`);

  const tests = [
    { name: 'Registration', fn: testRegistration },
    { name: 'Verification Status', fn: testVerificationStatus },
    { name: 'Verification Stats', fn: testVerificationStats },
    { name: 'Duplicate Registration', fn: testDuplicateRegistration },
    { name: 'Invalid Token', fn: testInvalidEmailConfirmation },
    { name: 'Resend Verification', fn: testResendVerification },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Cleanup Expired Tokens', fn: testCleanupExpiredTokens }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Test ${test.name} threw an error:`, error);
      failed++;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 TEST RESULTS');
  console.log('===============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Email verification system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above for details.');
  }

  // Clean up test user
  if (createdUserId) {
    console.log(`\n🧹 Note: Test user created with ID ${createdUserId} and email ${TEST_EMAIL}`);
    console.log('You may want to clean this up manually from the database.');
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testRegistration,
  testVerificationStatus,
  testVerificationStats,
  testDuplicateRegistration,
  testInvalidEmailConfirmation,
  testResendVerification,
  testRateLimiting,
  testCleanupExpiredTokens
};