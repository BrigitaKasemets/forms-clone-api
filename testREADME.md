# Forms Clone API Test Script

I've created a comprehensive test script for your Forms Clone API. This script validates all endpoints and features of your API, including authentication, forms, questions, responses, and users.

## Setup

1. First, you'll need to install the node-fetch package:

```bash
npm install node-fetch@2
```

2. Save the script as `api-test.js` in your project root directory.

3. Make sure your API server is running:

```bash
npm run dev
```

4. Run the test script:

```bash
node api-test.js
```

## What the Script Tests

The script tests the following functionality:

### 1. Authentication
- Login (create session)
- Logout (delete session)

### 2. Form Management
- Create a form
- Get all forms
- Get a specific form
- Update a form
- Delete a form

### 3. Question Management
- Create questions (both short text and multiple choice)
- Get all questions for a form
- Get a specific question
- Update a question
- Delete questions

### 4. Response Management
- Create a response with answers to questions
- Get all responses for a form
- Get a specific response
- Update a response
- Delete a response

### 5. User Management
- Get user profile
- List all users

### 6. Error Handling
- Try to access non-existent resources
- Try to create invalid resources

## How It Works

The script:

1. Runs tests in sequence, with each test depending on the success of previous tests
2. Tracks test passes, failures, and skips
3. Provides detailed error messages when tests fail
4. Cleans up by deleting created resources
5. Displays a summary of test results at the end

## Customization

You can modify the script for your needs:

- Change the `API_URL` constant if your server runs on a different port
- Modify the test user credentials if needed
- Add or remove tests as your API evolves

## Troubleshooting

If tests fail, check:

1. Is your server running?
2. Do you have the correct admin user credentials?
3. Does your database have the correct schema?
4. Have you implemented all the required endpoints?

The script provides detailed error messages to help you identify issues with your API implementation.