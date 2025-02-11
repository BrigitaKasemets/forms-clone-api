Forms Clone API

A RESTful API for managing forms and user sessions, built with Express.js. This API allows users to create, update, and manage forms efficiently.

Features

User Session Management: Create, retrieve, and delete user sessions.

Form Management: Create, retrieve, update, and delete forms.

Swagger Documentation: Interactive API documentation available at /api-docs.

Getting Started

Prerequisites

Node.js (v16 or higher)

npm (v8 or higher)

Installation

Clone the repository:

git clone https://github.com/BrigitaKasemets/FormsCloneAPI.git
cd FormsCloneAPI

Install dependencies:

npm install

Start the server

npm run dev

Access the API at http://localhost:3000.

API Documentation

The API is documented using Swagger. You can access the interactive documentation at:

http://localhost:3000/api-docs/

Endpoints

Sessions

POST /sessions - Create a new session

GET /sessions - Retrieve current session

DELETE /sessions - Logout user

Forms

GET /forms - Retrieve all forms

POST /forms - Create a new form

GET /forms/:formId - Retrieve a specific form

PATCH /forms/:formId - Update a form

DELETE /forms/:formId - Delete a form

License

This project is licensed under the MIT License.