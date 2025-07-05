#!/usr/bin/env node

/**
 * API Diagnostic Tool
 * Helps identify why the UserEssaySubmission API is returning 403 errors
 */

const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null,
            rawData: data
          });
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
    
    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
        networkError: true
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function diagnoseAPI() {
  console.log('🔍 API Diagnostic Tool');
  console.log('======================');
  
  const BASE_URL = 'http://localhost:1337';
  const endpoints = [
    { name: 'Root', url: `${BASE_URL}/` },
    { name: 'Health Check', url: `${BASE_URL}/api` },
    { name: 'Subjects', url: `${BASE_URL}/api/subjects?pagination[limit]=1` },
    { name: 'Essays', url: `${BASE_URL}/api/essays?pagination[limit]=1` },
    { name: 'Answers', url: `${BASE_URL}/api/answers?pagination[limit]=1` },
    { name: 'UserEssaySubmissions List', url: `${BASE_URL}/api/user-essay-submissions` },
    { name: 'UserEssaySubmissions Approved', url: `${BASE_URL}/api/user-essay-submissions/approved` }
  ];
  
  console.log('\n1. Testing existing API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url);
      console.log(`   ${endpoint.name}:`);
      console.log(`     Status: ${response.status}`);
      
      if (response.status === 200) {
        const dataLength = response.data?.data?.length || 0;
        console.log(`     ✅ Success (${dataLength} items)`);
      } else if (response.status === 403) {
        console.log(`     🔒 Forbidden - Authentication/Authorization issue`);
      } else if (response.status === 404) {
        console.log(`     ❌ Not Found - Endpoint doesn't exist`);
      } else if (response.status === 500) {
        console.log(`     💥 Server Error`);
        console.log(`     Error: ${response.data?.error?.message || 'Unknown'}`);
      } else {
        console.log(`     ⚠️  Status ${response.status}: ${response.data?.error?.message || 'Unknown'}`);
      }
      
    } catch (error) {
      console.log(`   ${endpoint.name}: ❌ ${error.message}`);
    }
  }
  
  console.log('\n2. Testing UserEssaySubmission POST endpoint...');
  
  const testData = {
    data: {
      title: 'Test Essay',
      content: '<p>Test content</p>',
      submitterName: 'Test User',
      submitterEmail: 'test@example.com',
      submitterYear: 'ThirdYear',
      agreedToTerms: true,
      publishingConsent: true
    }
  };
  
  try {
    const postResponse = await makeRequest(`${BASE_URL}/api/user-essay-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`   POST Status: ${postResponse.status}`);
    if (postResponse.status === 200 || postResponse.status === 201) {
      console.log(`   ✅ POST Success`);
    } else if (postResponse.status === 403) {
      console.log(`   🔒 POST Forbidden - Check permissions`);
    } else if (postResponse.status === 404) {
      console.log(`   ❌ POST Not Found - Content type may not be registered`);
    } else if (postResponse.status === 400) {
      console.log(`   ⚠️  POST Validation Error: ${postResponse.data?.error?.message}`);
    } else {
      console.log(`   ⚠️  POST Status ${postResponse.status}: ${postResponse.data?.error?.message || 'Unknown'}`);
    }
    
    if (postResponse.data?.error?.details) {
      console.log(`   Error Details: ${JSON.stringify(postResponse.data.error.details, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`   POST Request Failed: ${error.message}`);
  }
  
  console.log('\n3. Diagnosis Summary:');
  console.log('====================');
  
  // Test if server is responding to known endpoints
  const subjectsTest = await makeRequest(`${BASE_URL}/api/subjects?pagination[limit]=1`);
  const essaysTest = await makeRequest(`${BASE_URL}/api/essays?pagination[limit]=1`);
  const userEssayTest = await makeRequest(`${BASE_URL}/api/user-essay-submissions`);
  
  console.log('\nServer Status:');
  if (subjectsTest.status === 200 || essaysTest.status === 200) {
    console.log('✅ Strapi is running and serving API requests');
  } else {
    console.log('❌ Strapi may not be properly configured or running');
  }
  
  console.log('\nUserEssaySubmission Content Type Status:');
  if (userEssayTest.status === 403) {
    console.log('🔒 Content type exists but has permission restrictions');
    console.log('💡 Possible issues:');
    console.log('   • Public permissions not enabled in admin panel');
    console.log('   • Content type requires authentication');
    console.log('   • Custom policies blocking access');
  } else if (userEssayTest.status === 404) {
    console.log('❌ Content type not found');
    console.log('💡 Possible solutions:');
    console.log('   • Restart Strapi server to register new content type');
    console.log('   • Check if content type files are properly created');
  } else if (userEssayTest.status === 200) {
    console.log('✅ Content type is accessible');
  } else {
    console.log(`⚠️  Unexpected status: ${userEssayTest.status}`);
  }
  
  console.log('\n🎯 Recommended Actions:');
  console.log('=======================');
  
  if (userEssayTest.status === 403) {
    console.log('1. Check Strapi Admin Panel:');
    console.log('   • Go to Settings > Roles & Permissions > Public');
    console.log('   • Enable permissions for User-essay-submission endpoints');
    console.log('   • Ensure "findApproved" and "create" are enabled for Public role');
    console.log('');
    console.log('2. Verify route configuration in:');
    console.log('   • /src/api/user-essay-submission/routes/user-essay-submission.js');
    console.log('   • Ensure public routes have empty policies array');
    console.log('');
    console.log('3. Check for global policies that might block access');
  } else if (userEssayTest.status === 404) {
    console.log('1. Restart Strapi server: npm run develop');
    console.log('2. Check if content type is properly created');
    console.log('3. Verify file structure in /src/api/user-essay-submission/');
  }
}

// Run diagnostic
if (require.main === module) {
  diagnoseAPI().catch(console.error);
}

module.exports = { diagnoseAPI };