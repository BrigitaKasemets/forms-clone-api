import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from './middleware/auth.js';
import sessionsRouter from './routes/sessions.js';
import formsRouter from './routes/forms.js';
import questionsRouter from './routes/questions.js';
import responsesRouter from './routes/responses.js';
import usersRouter from './routes/users.js';
import { userDb } from './db/db.js';

// Määrame projekti juurkausta dünaamiliselt
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Kasutame õiget asukohta (projekti juurkaust)
const openApiPath = join(__dirname, '../openapi.yaml');

let swaggerDocument;
try {
    const fileContent = await readFile(openApiPath, 'utf8');
    swaggerDocument = yaml.parse(fileContent);
    console.log('✅ OpenAPI file loaded successfully');
} catch (error) {
    console.error('❌ Failed to load OpenAPI file:', error);
    process.exit(1); // Peatab rakenduse, kui fail puudub
}

const app = express();
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/sessions', sessionsRouter);
app.use('/forms', formsRouter);
app.use('/forms', questionsRouter);
app.use('/forms', responsesRouter);
app.use('/users', usersRouter);

// User Routes
app.post('/users', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const user = await userDb.createUser(email, password, name);
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'Email already exists') {
            res.status(400).json({ error: error.message });
        } else {
            console.error('User creation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Protected Routes - require authentication
app.get('/forms', authenticateToken, (req, res) => {
    res.status(200).json([]);
});

app.post('/forms', authenticateToken, (req, res) => {
    res.status(201).json(req.body);
});

app.get('/forms/:formId', authenticateToken, (req, res) => {
    res.status(200).json({ id: req.params.formId, title: "Sample Form" });
});

app.patch('/forms/:formId', authenticateToken, (req, res) => {
    res.status(200).json({ id: req.params.formId, ...req.body });
});

app.delete('/forms/:formId', authenticateToken, (req, res) => {
    res.status(204).send();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📜 Swagger docs available at http://localhost:${PORT}/api-docs`);
});