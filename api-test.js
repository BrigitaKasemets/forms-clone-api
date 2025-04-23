// api-test.js
// Comprehensive test script for Forms Clone API

import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:3000';
const EMAIL = 'admin@example.com';
const PASSWORD = 'password123';

// Store tokens and IDs for use across tests
const STORAGE = {
  token: null,
  formId: null,
  questionId: null,
  responseId: null,
  userId: null
};

// Status tracking
const RESULTS = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// API helpers
async function request(method, path, body = null, requiresAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (requiresAuth && STORAGE.token) {
    headers['Authorization'] = `Bearer ${STORAGE.token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, options);
    
    // Store response status for testing
    const status = response.status;
    
    let data = null;
    if (status !== 204) { // No content
      try {
        data = await response.json();
      } catch (e) {
        // If not JSON, store text
        data = await response.text();
      }
    }
    
    return { status, data };
  } catch (error) {
    console.error(`${COLORS.red}Network error:${COLORS.reset}`, error.message);
    return { status: 0, data: null, error: error.message };
  }
}

// Test runner
async function runTest(name, test, dependencies = []) {
  RESULTS.total++;
  
  // Check if dependencies are met
  const unmetDependencies = dependencies.filter(dep => !STORAGE[dep]);
  if (unmetDependencies.length > 0) {
    console.log(`${COLORS.yellow}SKIPPED${COLORS.reset} ${name} - Missing dependencies: ${unmetDependencies.join(', ')}`);
    RESULTS.skipped++;
    return false;
  }

  try {
    console.log(`${COLORS.bright}Running:${COLORS.reset} ${name}...`);
    const result = await test();
    
    if (result === true) {
      console.log(`${COLORS.green}PASSED${COLORS.reset} ${name}\n`);
      RESULTS.passed++;
      return true;
    } else {
      console.log(`${COLORS.red}FAILED${COLORS.reset} ${name}: ${result}\n`);
      RESULTS.failed++;
      return false;
    }
  } catch (error) {
    console.log(`${COLORS.red}ERROR${COLORS.reset} ${name}: ${error.message}\n`);
    RESULTS.failed++;
    return false;
  }
}

// Test suites
const authTests = [
  {
    name: 'Login (create session)',
    test: async () => {
      const { status, data } = await request('POST', '/sessions', { email: EMAIL, password: PASSWORD }, false);
      
      if (status !== 201) {
        return `Expected status 201, got ${status}`;
      }
      
      if (!data.token || !data.userId) {
        return `Missing token or userId in response: ${JSON.stringify(data)}`;
      }
      
      STORAGE.token = data.token;
      STORAGE.userId = data.userId;
      return true;
    }
  }
];

const formTests = [
  {
    name: 'Create a form',
    dependencies: ['token'],
    test: async () => {
      const payload = {
        title: "Test Form",
        description: "This is a test form created by the API test script"
      };
      
      const { status, data } = await request('POST', '/forms', payload);
      
      if (status !== 201) {
        return `Expected status 201, got ${status}`;
      }
      
      if (!data.id) {
        return `No form ID returned: ${JSON.stringify(data)}`;
      }
      
      STORAGE.formId = data.id;
      return true;
    }
  },
  {
    name: 'Get all forms',
    dependencies: ['token'],
    test: async () => {
      const { status, data } = await request('GET', '/forms');
      
      if (status !== 200 && status !== 404) {
        return `Expected status 200 or 404, got ${status}`;
      }
      
      // 200 if forms exist, 404 if no forms
      if (status === 200 && (!data.data || !Array.isArray(data.data))) {
        return `Invalid forms list format: ${JSON.stringify(data)}`;
      }
      
      return true;
    }
  },
  {
    name: 'Get form by ID',
    dependencies: ['token', 'formId'],
    test: async () => {
      const { status, data } = await request('GET', `/forms/${STORAGE.formId}`);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (data.id !== STORAGE.formId) {
        return `Form ID mismatch: expected ${STORAGE.formId}, got ${data.id}`;
      }
      
      return true;
    }
  },
  {
    name: 'Update a form',
    dependencies: ['token', 'formId'],
    test: async () => {
      const payload = {
        title: "Updated Test Form",
        description: "This form was updated by the API test script"
      };
      
      const { status, data } = await request('PATCH', `/forms/${STORAGE.formId}`, payload);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (data.title !== payload.title) {
        return `Form title not updated correctly: ${data.title}`;
      }
      
      return true;
    }
  }
];

const questionTests = [
  {
    name: 'Create a short text question',
    dependencies: ['token', 'formId'],
    test: async () => {
      const payload = {
        text: "What is your name?",
        type: "shorttext"
      };
      
      const { status, data } = await request('POST', `/forms/${STORAGE.formId}/questions`, payload);
      
      if (status !== 201) {
        return `Expected status 201, got ${status}`;
      }
      
      if (!data.id) {
        return `No question ID returned: ${JSON.stringify(data)}`;
      }
      
      STORAGE.questionId = data.id;
      return true;
    }
  },
  {
    name: 'Create a multiple choice question',
    dependencies: ['token', 'formId'],
    test: async () => {
      const payload = {
        text: "What is your favorite color?",
        type: "multiplechoice",
        options: ["Red", "Green", "Blue", "Other"]
      };
      
      const { status, data } = await request('POST', `/forms/${STORAGE.formId}/questions`, payload);
      
      if (status !== 201) {
        return `Expected status 201, got ${status}`;
      }
      
      if (!data.id) {
        return `No question ID returned: ${JSON.stringify(data)}`;
      }
      
      // Store this as an additional question ID
      STORAGE.mcQuestionId = data.id;
      return true;
    }
  },
  {
    name: 'Get all questions for a form',
    dependencies: ['token', 'formId'],
    test: async () => {
      const { status, data } = await request('GET', `/forms/${STORAGE.formId}/questions`);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (!Array.isArray(data)) {
        return `Expected array of questions, got: ${JSON.stringify(data)}`;
      }
      
      if (data.length < 2) {
        return `Expected at least 2 questions, got ${data.length}`;
      }
      
      return true;
    }
  },
  {
    name: 'Get question by ID',
    dependencies: ['token', 'formId', 'questionId'],
    test: async () => {
      const { status, data } = await request('GET', `/forms/${STORAGE.formId}/questions/${STORAGE.questionId}`);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (data.id !== STORAGE.questionId) {
        return `Question ID mismatch: expected ${STORAGE.questionId}, got ${data.id}`;
      }
      
      return true;
    }
  },
  {
    name: 'Update a question',
    dependencies: ['token', 'formId', 'questionId'],
    test: async () => {
      const payload = {
        text: "What is your full name?"
      };
      
      const { status, data } = await request('PATCH', `/forms/${STORAGE.formId}/questions/${STORAGE.questionId}`, payload);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (data.text !== payload.text) {
        return `Question text not updated correctly: ${data.text}`;
      }
      
      return true;
    }
  }
];

const responseTests = [
  {
    name: 'Create a response',
    dependencies: ['token', 'formId', 'questionId', 'mcQuestionId'],
    test: async () => {
      const payload = {
        respondentName: "Test User",
        respondentEmail: "test@example.com",
        answers: [
          {
            questionId: STORAGE.questionId,
            answer: "John Doe"
          },
          {
            questionId: STORAGE.mcQuestionId,
            answer: "Blue"
          }
        ]
      };
      
      const { status, data } = await request('POST', `/forms/${STORAGE.formId}/responses`, payload);
      
      if (status !== 201) {
        return `Expected status 201, got ${status}: ${JSON.stringify(data)}`;
      }
      
      if (!data.id) {
        return `No response ID returned: ${JSON.stringify(data)}`;
      }
      
      // Check that respondent info is stored
      if (data.respondentName !== payload.respondentName) {
        return `Respondent name not stored correctly: ${data.respondentName}`;
      }
      
      STORAGE.responseId = data.id;
      return true;
    }
  },
  {
    name: 'Get all responses for a form',
    dependencies: ['token', 'formId'],
    test: async () => {
      const { status, data } = await request('GET', `/forms/${STORAGE.formId}/responses`);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (!Array.isArray(data)) {
        return `Expected array of responses, got: ${JSON.stringify(data)}`;
      }
      
      if (data.length < 1) {
        return `Expected at least 1 response, got ${data.length}`;
      }
      
      return true;
    }
  },
  {
    name: 'Get response by ID',
    dependencies: ['token', 'formId', 'responseId'],
    test: async () => {
      const { status, data } = await request('GET', `/forms/${STORAGE.formId}/responses/${STORAGE.responseId}`);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (data.id !== STORAGE.responseId) {
        return `Response ID mismatch: expected ${STORAGE.responseId}, got ${data.id}`;
      }
      
      return true;
    }
  },
  {
    name: 'Update a response',
    dependencies: ['token', 'formId', 'responseId', 'questionId'],
    test: async () => {
      const payload = {
        respondentName: "Updated Test User",
        answers: [
          {
            questionId: STORAGE.questionId,
            answer: "Jane Doe"
          }
        ]
      };
      
      const { status, data } = await request('PATCH', `/forms/${STORAGE.formId}/responses/${STORAGE.responseId}`, payload);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (data.respondentName !== payload.respondentName) {
        return `Respondent name not updated correctly: ${data.respondentName}`;
      }
      
      return true;
    }
  }
];

const userTests = [
  {
    name: 'Get user profile',
    dependencies: ['token', 'userId'],
    test: async () => {
      const { status, data } = await request('GET', `/users/${STORAGE.userId}`);
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (data.id != STORAGE.userId) {
        return `User ID mismatch: expected ${STORAGE.userId}, got ${data.id}`;
      }
      
      return true;
    }
  },
  {
    name: 'List all users',
    dependencies: ['token'],
    test: async () => {
      const { status, data } = await request('GET', '/users');
      
      if (status !== 200) {
        return `Expected status 200, got ${status}`;
      }
      
      if (!Array.isArray(data)) {
        return `Expected array of users, got: ${JSON.stringify(data)}`;
      }
      
      return true;
    }
  }
];

const cleanupTests = [
  {
    name: 'Delete response',
    dependencies: ['token', 'formId', 'responseId'],
    test: async () => {
      const { status } = await request('DELETE', `/forms/${STORAGE.formId}/responses/${STORAGE.responseId}`);
      
      if (status !== 204) {
        return `Expected status 204, got ${status}`;
      }
      
      return true;
    }
  },
  {
    name: 'Delete questions',
    dependencies: ['token', 'formId', 'questionId', 'mcQuestionId'],
    test: async () => {
      // Delete first question
      let { status } = await request('DELETE', `/forms/${STORAGE.formId}/questions/${STORAGE.questionId}`);
      
      if (status !== 204) {
        return `Expected status 204 for first question, got ${status}`;
      }
      
      // Delete second question
      status = (await request('DELETE', `/forms/${STORAGE.formId}/questions/${STORAGE.mcQuestionId}`)).status;
      
      if (status !== 204) {
        return `Expected status 204 for second question, got ${status}`;
      }
      
      return true;
    }
  },
  {
    name: 'Delete form',
    dependencies: ['token', 'formId'],
    test: async () => {
      const { status } = await request('DELETE', `/forms/${STORAGE.formId}`);
      
      if (status !== 204) {
        return `Expected status 204, got ${status}`;
      }
      
      return true;
    }
  },
  {
    name: 'Logout (delete session)',
    dependencies: ['token'],
    test: async () => {
      const { status } = await request('DELETE', '/sessions');
      
      if (status !== 204) {
        return `Expected status 204, got ${status}`;
      }
      
      return true;
    }
  }
];

// Error handling tests
const errorTests = [
  {
    name: 'Try to get non-existent form',
    dependencies: ['token'],
    test: async () => {
      const { status } = await request('GET', '/forms/99999');
      
      if (status !== 404) {
        return `Expected status 404, got ${status}`;
      }
      
      return true;
    }
  },
  {
    name: 'Try to create form with missing title',
    dependencies: ['token'],
    test: async () => {
      const payload = {
        description: "This form should fail validation"
      };
      
      const { status } = await request('POST', '/forms', payload);
      
      if (status !== 400) {
        return `Expected status 400, got ${status}`;
      }
      
      return true;
    }
  },
  {
    name: 'Try to create invalid question type',
    dependencies: ['token', 'formId'],
    test: async () => {
      const payload = {
        text: "Invalid question",
        type: "invalid_type"
      };
      
      const { status } = await request('POST', `/forms/${STORAGE.formId}/questions`, payload);
      
      if (status !== 400) {
        return `Expected status 400, got ${status}`;
      }
      
      return true;
    }
  }
];

// Main test runner
async function runAllTests() {
  console.log(`${COLORS.bright}${COLORS.blue}========== Forms Clone API Test Suite ==========${COLORS.reset}\n`);
  
  console.log(`${COLORS.cyan}[1/8] Testing Authentication${COLORS.reset}`);
  for (const test of authTests) {
    await runTest(test.name, test.test, test.dependencies);
  }
  
  console.log(`\n${COLORS.cyan}[2/8] Testing Form Management${COLORS.reset}`);
  for (const test of formTests) {
    await runTest(test.name, test.test, test.dependencies);
  }
  
  console.log(`\n${COLORS.cyan}[3/8] Testing Question Management${COLORS.reset}`);
  for (const test of questionTests) {
    await runTest(test.name, test.test, test.dependencies);
  }
  
  console.log(`\n${COLORS.cyan}[4/8] Testing Response Management${COLORS.reset}`);
  for (const test of responseTests) {
    await runTest(test.name, test.test, test.dependencies);
  }
  
  console.log(`\n${COLORS.cyan}[5/8] Testing User Management${COLORS.reset}`);
  for (const test of userTests) {
    await runTest(test.name, test.test, test.dependencies);
  }
  
  console.log(`\n${COLORS.cyan}[6/8] Testing Error Handling${COLORS.reset}`);
  for (const test of errorTests) {
    await runTest(test.name, test.test, test.dependencies);
  }

  console.log(`\n${COLORS.cyan}[7/8] Cleaning Up${COLORS.reset}`);
  for (const test of cleanupTests) {
    await runTest(test.name, test.test, test.dependencies);
  }
  
  console.log(`\n${COLORS.cyan}[8/8] Final Results:${COLORS.reset}`);
  console.log(`${COLORS.bright}Total tests: ${RESULTS.total}${COLORS.reset}`);
  console.log(`${COLORS.green}Passed: ${RESULTS.passed}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed: ${RESULTS.failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Skipped: ${RESULTS.skipped}${COLORS.reset}`);
  
  const passRate = Math.round((RESULTS.passed / (RESULTS.total - RESULTS.skipped)) * 100);
  
  console.log(`\n${COLORS.bright}Pass rate: ${passRate}%${COLORS.reset}`);
  
  if (RESULTS.failed === 0) {
    console.log(`\n${COLORS.green}${COLORS.bright}All tests passed! Your API is working correctly.${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.red}${COLORS.bright}Some tests failed. Check the logs above for details.${COLORS.reset}`);
  }
}

// Run all tests
runAllTests();