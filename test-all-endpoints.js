#!/usr/bin/env node
/**
 * Comprehensive API Test Script
 * Tests all major endpoints with authentication
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials
const ADMIN_CREDS = {
  email: 'admin@portal.com',
  password: 'Admin123!'
};

const INSTRUCTOR_CREDS = {
  email: 'instructor@portal.com',
  password: 'Instructor123!'
};

const LEARNER_CREDS = {
  email: 'learner-a@test.local',
  password: 'TestPass123!'
};

let sessionCookie = null;

async function login(credentials) {
  console.log(`\n🔐 Logging in as ${credentials.email}...`);
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  const data = await response.json();
  console.log(`✅ Logged in successfully as ${data.role}`);
  return data;
}

async function testEndpoint(name, url, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      ...options.headers
    };

    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      console.log(`✅ ${name}: ${response.status}`);
      return { success: true, status: response.status, data };
    } else {
      console.log(`❌ ${name}: ${response.status} - ${JSON.stringify(data).substring(0, 100)}`);
      return { success: false, status: response.status, data };
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive API Tests\n');
  console.log('=' .repeat(60));

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: Login as Admin
  console.log('\n📋 TEST SUITE: Authentication');
  console.log('-'.repeat(60));
  
  try {
    await login(ADMIN_CREDS);
    results.total++;
    results.passed++;
  } catch (error) {
    console.log(`❌ Admin login failed: ${error.message}`);
    results.total++;
    results.failed++;
    return results;
  }

  // Test 2: Get Current User
  results.total++;
  const meResult = await testEndpoint('GET /api/me', '/api/me');
  if (meResult.success) {
    results.passed++;
    console.log(`   User: ${meResult.data?.user?.email} (${meResult.data?.user?.activeRole})`);
  } else {
    results.failed++;
  }

  // Test 3: Dashboard
  console.log('\n📋 TEST SUITE: Dashboard');
  console.log('-'.repeat(60));
  
  results.total++;
  const dashResult = await testEndpoint('GET /api/dashboard', '/api/dashboard');
  if (dashResult.success) {
    results.passed++;
    const stats = dashResult.data?.stats;
    if (stats) {
      console.log(`   Active Users: ${stats.activeUsers}`);
      console.log(`   Total Courses: ${stats.totalCourses}`);
      console.log(`   Published Courses: ${stats.publishedCourses}`);
      console.log(`   Total Branches: ${stats.totalBranches}`);
    }
  } else {
    results.failed++;
  }

  // Test 4: Users
  console.log('\n📋 TEST SUITE: User Management');
  console.log('-'.repeat(60));
  
  results.total++;
  const usersResult = await testEndpoint('GET /api/users', '/api/users');
  if (usersResult.success) {
    results.passed++;
    console.log(`   Total Users: ${usersResult.data?.total || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 5: Courses
  console.log('\n📋 TEST SUITE: Course Management');
  console.log('-'.repeat(60));
  
  results.total++;
  const coursesResult = await testEndpoint('GET /api/courses', '/api/courses');
  if (coursesResult.success) {
    results.passed++;
    console.log(`   Total Courses: ${coursesResult.data?.total || coursesResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 6: Enrollments
  results.total++;
  const enrollResult = await testEndpoint('GET /api/enrollments', '/api/enrollments');
  if (enrollResult.success) {
    results.passed++;
    console.log(`   Total Enrollments: ${enrollResult.data?.total || enrollResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 7: Learning Paths
  console.log('\n📋 TEST SUITE: Learning Paths');
  console.log('-'.repeat(60));
  
  results.total++;
  const lpResult = await testEndpoint('GET /api/learning-paths', '/api/learning-paths');
  if (lpResult.success) {
    results.passed++;
    console.log(`   Total Learning Paths: ${lpResult.data?.total || lpResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 8: Groups
  console.log('\n📋 TEST SUITE: Groups');
  console.log('-'.repeat(60));
  
  results.total++;
  const groupsResult = await testEndpoint('GET /api/groups', '/api/groups');
  if (groupsResult.success) {
    results.passed++;
    console.log(`   Total Groups: ${groupsResult.data?.total || groupsResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 9: Skills
  console.log('\n📋 TEST SUITE: Skills');
  console.log('-'.repeat(60));
  
  results.total++;
  const skillsResult = await testEndpoint('GET /api/skills', '/api/skills');
  if (skillsResult.success) {
    results.passed++;
    console.log(`   Total Skills: ${skillsResult.data?.total || skillsResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 10: Categories
  console.log('\n📋 TEST SUITE: Categories');
  console.log('-'.repeat(60));
  
  results.total++;
  const catResult = await testEndpoint('GET /api/categories', '/api/categories');
  if (catResult.success) {
    results.passed++;
    console.log(`   Total Categories: ${catResult.data?.total || catResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 11: Assignments
  console.log('\n📋 TEST SUITE: Assignments');
  console.log('-'.repeat(60));
  
  results.total++;
  const assignResult = await testEndpoint('GET /api/assignments', '/api/assignments');
  if (assignResult.success) {
    results.passed++;
    console.log(`   Total Assignments: ${assignResult.data?.total || assignResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test 12: Branches
  console.log('\n📋 TEST SUITE: Branches');
  console.log('-'.repeat(60));
  
  results.total++;
  const branchResult = await testEndpoint('GET /api/branches', '/api/branches');
  if (branchResult.success) {
    results.passed++;
    console.log(`   Total Branches: ${branchResult.data?.total || branchResult.data?.length || 'N/A'}`);
  } else {
    results.failed++;
  }

  // Test as Instructor
  console.log('\n📋 TEST SUITE: Instructor Role');
  console.log('-'.repeat(60));
  
  try {
    await login(INSTRUCTOR_CREDS);
    results.total++;
    results.passed++;
    
    results.total++;
    const instCoursesResult = await testEndpoint('GET /api/instructor/courses', '/api/instructor/courses');
    if (instCoursesResult.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ Instructor tests failed: ${error.message}`);
    results.total += 2;
    results.failed += 2;
  }

  // Test as Learner
  console.log('\n📋 TEST SUITE: Learner Role');
  console.log('-'.repeat(60));
  
  try {
    await login(LEARNER_CREDS);
    results.total++;
    results.passed++;
    
    results.total++;
    const learnerCoursesResult = await testEndpoint('GET /api/learner/courses', '/api/learner/courses');
    if (learnerCoursesResult.success) {
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ Learner tests failed: ${error.message}`);
    results.total += 2;
    results.failed += 2;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The system is working correctly.');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the errors above.`);
  }

  return results;
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
