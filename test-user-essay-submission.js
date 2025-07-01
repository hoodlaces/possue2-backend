#!/usr/bin/env node

/**
 * Test script for User Essay Submission API
 */

const https = require('https');

// Test configuration
const BASE_URL = 'http://localhost:1337';
const TEST_SUBMISSION = {
  title: 'Test Constitutional Law Essay',
  content: '<p>This is a test essay about constitutional law principles and their application in modern legal practice.</p>',
  submissionType: 'essay',
  submitterName: 'Test Student',
  submitterEmail: 'test.student@lawschool.edu',
  submitterYear: '3L',
  lawSchool: 'Test Law School',
  graduationYear: 2024,
  agreedToTerms: true,
  publishingConsent: true,
  isAnonymous: false
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = require(url.startsWith('https:') ? 'https' : 'http').request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
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
 * Test API endpoints
 */
async function runTests() {
  console.log('🧪 Testing User Essay Submission API');
  console.log('=====================================');
  
  try {
    // Test 1: Check if API is responding
    console.log('\n1. Testing API connectivity...');
    const healthCheck = await makeRequest(`${BASE_URL}/api/essays?pagination[limit]=1`);
    
    if (healthCheck.status === 200) {
      console.log('   ✅ API is responding');
    } else {
      console.log('   ❌ API not responding:', healthCheck.status);
      return;
    }
    
    // Test 2: Test submission endpoint (expect to fail until server restart)
    console.log('\n2. Testing submission endpoint...');
    
    const submissionRequest = await makeRequest(`${BASE_URL}/api/user-essay-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: TEST_SUBMISSION })
    });
    
    console.log(`   Status: ${submissionRequest.status}`);
    if (submissionRequest.status === 200 || submissionRequest.status === 201) {
      console.log('   ✅ Submission endpoint working');
      console.log('   📝 Submission ID:', submissionRequest.data?.data?.id);
    } else if (submissionRequest.status === 404) {
      console.log('   ⚠️  Endpoint not found - server restart required');
    } else {
      console.log('   ❌ Unexpected response:', submissionRequest.data);
    }
    
    // Test 3: Test approved submissions endpoint
    console.log('\n3. Testing approved submissions endpoint...');
    
    const approvedRequest = await makeRequest(`${BASE_URL}/api/user-essay-submissions/approved`);
    
    console.log(`   Status: ${approvedRequest.status}`);
    if (approvedRequest.status === 200) {
      console.log('   ✅ Approved submissions endpoint working');
    } else if (approvedRequest.status === 404) {
      console.log('   ⚠️  Endpoint not found - server restart required');
    } else {
      console.log('   ❌ Unexpected response:', approvedRequest.data);
    }
    
    // Test 4: Test statistics endpoint (admin only - expect 401/403)
    console.log('\n4. Testing admin statistics endpoint...');
    
    const statsRequest = await makeRequest(`${BASE_URL}/api/user-essay-submissions/statistics`);
    
    console.log(`   Status: ${statsRequest.status}`);
    if (statsRequest.status === 401 || statsRequest.status === 403) {
      console.log('   ✅ Admin protection working (unauthorized as expected)');
    } else if (statsRequest.status === 404) {
      console.log('   ⚠️  Endpoint not found - server restart required');
    } else {
      console.log('   ❌ Unexpected response:', statsRequest.data);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    if (submissionRequest.status === 404) {
      console.log('⚠️  New content type detected but not yet active');
      console.log('📝 Next steps:');
      console.log('   1. Restart Strapi server: npm run develop');
      console.log('   2. Check admin panel for new content type');
      console.log('   3. Re-run this test script');
    } else {
      console.log('✅ API endpoints are functional');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };