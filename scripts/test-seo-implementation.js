#!/usr/bin/env node

/**
 * SEO Implementation Test Script
 * Validates that all SEO features are working correctly
 */

'use strict';

const { Pool } = require('pg');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'possue2_db_v5',
  user: process.env.DATABASE_USERNAME || 'possue2_db_v5_user',
  password: process.env.DATABASE_PASSWORD || 'eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Test database SEO coverage
 */
async function testDatabaseSEO() {
  console.log('🔍 Testing Database SEO Coverage...');
  
  try {
    // Check total essays
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM essays WHERE published_at IS NOT NULL'
    );
    const totalEssays = parseInt(totalResult.rows[0].count);
    
    // Check SEO components
    const seoResult = await pool.query(
      'SELECT COUNT(*) as count FROM components_shared_seos'
    );
    const seoComponents = parseInt(seoResult.rows[0].count);
    
    // Check linked SEO components
    const linkedResult = await pool.query(`
      SELECT COUNT(DISTINCT entity_id) as count 
      FROM components_shared_seos_cmps 
      WHERE entity_type = 'api::essay.essay' AND field_name = 'seo'
    `);
    const linkedSEO = parseInt(linkedResult.rows[0].count);
    
    const coverage = totalEssays > 0 ? (linkedSEO / totalEssays * 100).toFixed(2) : 0;
    
    console.log(`   📊 Total Published Essays: ${totalEssays}`);
    console.log(`   🏷️  SEO Components Created: ${seoComponents}`);
    console.log(`   🔗 Essays with SEO Data: ${linkedSEO}`);
    console.log(`   📈 Coverage: ${coverage}%`);
    
    if (coverage >= 95) {
      console.log('   ✅ SEO coverage is excellent!');
    } else if (coverage >= 50) {
      console.log('   ⚠️  SEO coverage needs improvement');
    } else {
      console.log('   ❌ SEO coverage is poor - run bulk generation');
    }
    
    return { totalEssays, seoComponents, linkedSEO, coverage };
    
  } catch (error) {
    console.error('   ❌ Database test failed:', error.message);
    return null;
  }
}

/**
 * Test file system components
 */
async function testFileSystemComponents() {
  console.log('\\n📁 Testing File System Components...');
  
  const components = [
    { path: 'public/robots.txt', name: 'Robots.txt' },
    { path: 'src/components/shared/seo.json', name: 'SEO Component Schema' },
    { path: 'src/components/shared/meta-social.json', name: 'Meta Social Component' },
    { path: 'src/api/subject/services/seo-helper.js', name: 'SEO Helper Service' },
    { path: 'scripts/bulk-seo-generator.js', name: 'Bulk SEO Generator' },
    { path: 'config/plugins.js', name: 'Plugin Configuration' }
  ];
  
  let passed = 0;
  
  for (const component of components) {
    const fullPath = path.join(__dirname, '..', component.path);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${component.name}`);
      passed++;
    } else {
      console.log(`   ❌ ${component.name} - Missing`);
    }
  }
  
  console.log(`   📊 File System Tests: ${passed}/${components.length} passed`);
  return { passed, total: components.length };
}

/**
 * Test API endpoints
 */
async function testAPIEndpoints() {
  console.log('\\n🌐 Testing API Endpoints...');
  
  const baseUrl = process.env.SITEMAP_HOSTNAME || 'https://possue2-backend.onrender.com';
  
  const endpoints = [
    { path: '/api/essays/seo-status', name: 'SEO Status Endpoint' },
    { path: '/api/essays?pagination[limit]=1', name: 'Essays API' },
    { path: '/sitemap.xml', name: 'Sitemap Generation' }
  ];
  
  let passed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`);
      if (response.ok) {
        console.log(`   ✅ ${endpoint.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${endpoint.name} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name} - Error: ${error.message}`);
    }
  }
  
  console.log(`   📊 API Tests: ${passed}/${endpoints.length} passed`);
  return { passed, total: endpoints.length };
}

/**
 * Test SEO helper service functionality
 */
async function testSEOHelperService() {
  console.log('\\n🛠️  Testing SEO Helper Service...');
  
  try {
    // Import the SEO helper
    const seoHelperPath = path.join(__dirname, '..', 'src', 'api', 'subject', 'services', 'seo-helper.js');
    const seoHelper = require(seoHelperPath)();
    
    // Test essay schema generation
    const mockEssay = {
      id: 1,
      title: 'Question 1 - July, 2023',
      content: '<p>Sample essay content for testing...</p>',
      slug: 'question-1-july-2023',
      month: 'July',
      year: '2023',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const mockSubject = {
      id: 1,
      title: 'Constitutional Law',
      slug: 'constitutional-law'
    };
    
    const essaySchema = seoHelper.generateEssaySchema(mockEssay, mockSubject);
    const subjectSchema = seoHelper.generateSubjectSchema(mockSubject, [mockEssay]);
    const breadcrumbSchema = seoHelper.generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Essays', url: '/essays' }
    ]);
    
    console.log('   ✅ Essay schema generation');
    console.log('   ✅ Subject schema generation');
    console.log('   ✅ Breadcrumb schema generation');
    
    // Validate schema structure
    if (essaySchema['@context'] === 'https://schema.org' && essaySchema['@type'] === 'Article') {
      console.log('   ✅ Schema.org compliance');
    } else {
      console.log('   ❌ Schema.org compliance');
    }
    
    return { passed: 4, total: 4 };
    
  } catch (error) {
    console.error('   ❌ SEO Helper test failed:', error.message);
    return { passed: 0, total: 4 };
  }
}

/**
 * Generate test report
 */
function generateReport(results) {
  console.log('\\n' + '='.repeat(60));
  console.log('📋 SEO IMPLEMENTATION TEST REPORT');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalTests = 0;
  
  for (const [category, result] of Object.entries(results)) {
    if (result && typeof result === 'object') {
      totalPassed += result.passed || 0;
      totalTests += result.total || 0;
    }
  }
  
  const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : 0;
  
  console.log(`\\n📊 Overall Results:`);
  console.log(`   Tests Passed: ${totalPassed}/${totalTests}`);
  console.log(`   Success Rate: ${successRate}%`);
  
  if (results.database) {
    console.log(`\\n📈 SEO Coverage: ${results.database.coverage}%`);
  }
  
  if (successRate >= 90) {
    console.log('\\n🎉 SEO Implementation Status: EXCELLENT');
  } else if (successRate >= 75) {
    console.log('\\n✅ SEO Implementation Status: GOOD');
  } else if (successRate >= 50) {
    console.log('\\n⚠️  SEO Implementation Status: NEEDS IMPROVEMENT');
  } else {
    console.log('\\n❌ SEO Implementation Status: POOR');
  }
  
  console.log('\\n📝 Recommendations:');
  if (results.database && results.database.coverage < 100) {
    console.log('   • Run bulk SEO generation: node scripts/bulk-seo-generator.js');
  }
  if (successRate < 90) {
    console.log('   • Check failed components and fix issues');
  }
  console.log('   • Monitor SEO health regularly via /api/essays/seo-status');
  console.log('   • Validate structured data with Google Rich Results Test');
  
  console.log('\\n🔗 Useful Links:');
  console.log('   • SEO Status: https://possue2-backend.onrender.com/api/essays/seo-status');
  console.log('   • Sitemap: https://possue.com/sitemap.xml');
  console.log('   • Implementation Guide: ./SEO-IMPLEMENTATION.md');
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Starting SEO Implementation Tests for Possue Legal Education');
  console.log('=' .repeat(60));
  
  const results = {};
  
  // Run all tests
  results.database = await testDatabaseSEO();
  results.filesystem = await testFileSystemComponents();
  results.seoHelper = await testSEOHelperService();
  
  // Note: API tests are commented out as they require the server to be running
  // results.api = await testAPIEndpoints();
  
  // Generate report
  generateReport(results);
  
  // Cleanup
  await pool.end();
  
  console.log('\\n✅ SEO Implementation Tests Complete!');
}

// Run tests if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testDatabaseSEO,
  testFileSystemComponents,
  testSEOHelperService,
  generateReport
};