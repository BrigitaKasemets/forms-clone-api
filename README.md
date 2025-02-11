# Forms API

A RESTful API for creating and managing forms and collecting responses, similar to Google Forms. Built with Express.js and SQLite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=3001
JWT_SECRET=your_secret_key_here
```

3. Initialize database:
```bash
npm run init-db
```

4. Start development server:
```bash
npm run dev
```

Server runs at `http://localhost:3001`
API documentation available at `http://localhost:3001/docs`

## API Endpoints

- `POST /api/v1/forms` - Create form
- `GET /api/v1/forms` - List forms
- `GET /api/v1/forms/{formId}` - Get form
- `PUT /api/v1/forms/{formId}` - Update form
- `DELETE /api/v1/forms/{formId}` - Delete form
- `POST /api/v1/forms/{formId}/responses` - Submit response
- `GET /api/v1/forms/{formId}/responses` - Get responses
- `GET /api/v1/forms/{formId}/summary` - Get summary# Forms