import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, sessions } from './middleware/auth.js';
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

// Authentication Routes
app.post('/sessions', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userDb.verifyUser(email, password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const session = await sessions.create(user.id);
        res.status(201).json({
            ...session,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/sessions', verifyToken, (req, res) => {
    res.status(200).json({
        token: req.user.token,
        userId: req.user.id,
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name
        }
    });
});

app.delete('/sessions', verifyToken, async (req, res) => {
    try {
        await sessions.remove(req.user.token);
        res.status(204).send();
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected Routes - require authentication
app.get('/forms', verifyToken, (req, res) => {
    res.status(200).json([]);
});

app.post('/forms', verifyToken, (req, res) => {
    res.status(201).json(req.body);
});

app.get('/forms/:formId', verifyToken, (req, res) => {
    res.status(200).json({ id: req.params.formId, title: "Sample Form" });
});

app.patch('/forms/:formId', verifyToken, (req, res) => {
    res.status(200).json({ id: req.params.formId, ...req.body });
});

app.delete('/forms/:formId', verifyToken, (req, res) => {
    res.status(204).send();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📜 Swagger docs available at http://localhost:${PORT}/api-docs`);
});