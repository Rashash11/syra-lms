/**
 * Final Comprehensive Test Before GitHub Push
 * Tests all critical functionality
 */

const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

// Test credentials
const testUsers = [
  { email: 'admin@portal.com', password: 'Admin123!', role: 'ADMIN' },
  { email: 'instructor@portal.com', password: 'Instructor123!', role: 'INSTRUCTOR' },
  { email: 'learner1@portal.com', password: 'Learner123!', role: 'LEARNER' }
];

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✓' : '✗';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${name}${details ? ': ' + details : ''}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testBackendHealth() {
  console.log('\n=== TESTING BACKEND ===');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    logTest('Backend health endpoint', response.ok, `Status: ${response.status}`);
  } catch (error) {
    logTest('Backend health endpoint', false, error.message);
  }
}

async function testFrontendHealth() {
  console.log('\n=== TESTING FRONTEND ===');
  
  try {
    const response = await fetch(FRONTEND_URL);
    logTest('Frontend accessible', response.ok, `Status: ${response.status}`);
  } catch (error) {
    logTest('Frontend accessible', false, error.message);
  }
}

async function testAuthentication() {
  console.log('\n=== TESTING AUTHENTICATION ===');
  
  for (const user of testUsers) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      const success = response.ok && (data.ok || data.userId);
      logTest(`Login as ${user.role}`, success, user.email);
      
      if (success) {
        // Test /me endpoint with cookies
        const meResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
          headers: { 'Cookie': response.headers.get('set-cookie') || '' }
        });
        const meData = await meResponse.json();
        logTest(`Get user info for ${user.role}`, meResponse.ok && meData.user);
      }
    } catch (error) {
      logTest(`Login as ${user.role}`, false, error.message);
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n=== TESTING API ENDPOINTS ===');
  
  // Login as admin first
  try {
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portal.com', password: 'Admin123!' }),
      credentials: 'include'
    });
    
    const loginData = await loginResponse.json();
    const cookies = loginResponse.headers.get('set-cookie') || '';
    
    if (!loginData.ok && !loginData.userId) {
      logTest('Admin login for API tests', false, 'Login failed');
      return;
    }
    
    logTest('Admin login for API tests', true);
    
    // Test users endpoint
    const usersResponse = await fetch(`${BACKEND_URL}/api/users?page=1&limit=10`, {
      credentials: 'include',
      headers: { 'Cookie': cookies }
    });
    const usersData = await usersResponse.json();
    logTest('GET /api/users', usersResponse.ok && usersData.users?.length > 0, `Found ${usersData.users?.length || 0} users`);
    
    // Test courses endpoint
    const coursesResponse = await fetch(`${BACKEND_URL}/api/courses?page=1&limit=10`, {
      credentials: 'include',
      headers: { 'Cookie': cookies }
    });
    const coursesData = await coursesResponse.json();
    logTest('GET /api/courses', coursesResponse.ok, `Found ${coursesData.courses?.length || 0} courses`);
    
    // Test dashboard endpoint
    const dashboardResponse = await fetch(`${BACKEND_URL}/api/dashboard`, {
      credentials: 'include',
      headers: { 'Cookie': cookies }
    });
    logTest('GET /api/dashboard', dashboardResponse.ok);
    
  } catch (error) {
    logTest('API endpoints test', false, error.message);
  }
}

async function testDatabase() {
  console.log('\n=== TESTING DATABASE ===');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const userCount = await prisma.user.count();
    logTest('Database connection', userCount > 0, `${userCount} users in database`);
    
    const courseCount = await prisma.course.count();
    logTest('Courses in database', courseCount > 0, `${courseCount} courses`);
    
    const enrollmentCount = await prisma.enrollment.count();
    logTest('Enrollments in database', enrollmentCount > 0, `${enrollmentCount} enrollments`);
    
    await prisma.$disconnect();
  } catch (error) {
    logTest('Database connection', false, error.message);
  }
}

async function testFrontendPages() {
  console.log('\n=== TESTING FRONTEND PAGES ===');
  
  const pages = [
    { path: '/', name: 'Home page' },
    { path: '/login', name: 'Login page' },
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`${FRONTEND_URL}${page.path}`);
      logTest(page.name, response.ok, `Status: ${response.status}`);
    } catch (error) {
      logTest(page.name, false, error.message);
    }
  }
}

async function runAllTests() {
  console.log('\x1b[36m');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          🧪 FINAL COMPREHENSIVE TEST SUITE 🧪             ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');
  
  await testBackendHealth();
  await testFrontendHealth();
  await testDatabase();
  await testAuthentication();
  await testAPIEndpoints();
  await testFrontendPages();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\x1b[36m=== TEST SUMMARY ===\x1b[0m');
  console.log('='.repeat(60));
  console.log(`\x1b[32m✓ Passed: ${testResults.passed}\x1b[0m`);
  console.log(`\x1b[31m✗ Failed: ${testResults.failed}\x1b[0m`);
  console.log(`Total: ${testResults.passed + testResults.failed}`);
  console.log('='.repeat(60));
  
  const passRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  console.log(`\nPass Rate: ${passRate}%`);
  
  if (testResults.failed === 0) {
    console.log('\n\x1b[32m✅ ALL TESTS PASSED! Ready to push to GitHub! 🚀\x1b[0m\n');
    process.exit(0);
  } else {
    console.log('\n\x1b[31m❌ Some tests failed. Please fix issues before pushing.\x1b[0m\n');
    console.log('Failed tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n\x1b[31mTest suite error:\x1b[0m', error);
  process.exit(1);
});
