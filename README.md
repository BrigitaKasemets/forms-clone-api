Based on the OpenAPI specification, I'll help enhance the README to include all available endpoints and additional features. Here's a more comprehensive version:

# Forms Clone API

A RESTful API for managing forms and user sessions, built with Express.js. This API allows users to create, update, and manage forms with multiple question types and collect responses efficiently.

## Features

* **User Session Management:** Create, retrieve, and delete user sessions with JWT authentication
* **Form Management:** Create, retrieve, update, and delete forms
* **Question Management:** Add various types of questions to forms including short text, paragraph, multiple choice, checkbox, and dropdown
* **Response Collection:** Gather and manage form responses
* **Swagger Documentation:** Interactive API documentation available at `/api-docs`

## Getting Started

### Prerequisites

* Node.js (v16 or higher)
* npm (v8 or higher)

### Installation

Clone the repository:

```sh
git clone https://github.com/BrigitaKasemets/FormsCloneAPI.git
cd FormsCloneAPI
```

Install dependencies:

```sh
npm install
```

### Start the server

```sh
npm run dev
```

Access the API at http://localhost:3000

## API Documentation

The API is documented using Swagger. You can access the interactive documentation at:

http://localhost:3000/api-docs/

## Endpoints

### Sessions

* `POST /sessions` - Create a new session (login)
* `GET /sessions` - Retrieve current session
* `DELETE /sessions` - Logout user

### Forms

* `GET /forms` - Retrieve all forms
* `POST /forms` - Create a new form
* `GET /forms/:formId` - Retrieve a specific form
* `PATCH /forms/:formId` - Update a form
* `DELETE /forms/:formId` - Delete a form

### Questions

* `GET /forms/:formId/questions` - List all questions for a form
* `POST /forms/:formId/questions` - Create a new question
* `GET /forms/:formId/questions/:questionId` - Get a specific question
* `PATCH /forms/:formId/questions/:questionId` - Update a question
* `DELETE /forms/:formId/questions/:questionId` - Delete a question

### Responses

* `GET /forms/:formId/responses` - List all responses for a form
* `POST /forms/:formId/responses` - Submit a new response
* `GET /forms/:formId/responses/:responseId` - Get a specific response
* `PATCH /forms/:formId/responses/:responseId` - Update a response
* `DELETE /forms/:formId/responses/:responseId` - Delete a response

## Question Types

The API supports various question types:
- Short text
- Paragraph
- Multiple choice
- Checkbox
- Dropdown

## Authentication

The API uses JWT (JSON Web Token) Bearer authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## License

This project is licensed under the MIT License.