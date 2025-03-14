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

// OpenAPI failide asukohad
const openApiPathEn = join(__dirname, '../openapi.en.yaml');
const openApiPathEt = join(__dirname, '../openapi.et.yaml');

// Loe mõlemad OpenAPI failid
let swaggerDocumentEn, swaggerDocumentEt;
try {
    const fileContentEn = await readFile(openApiPathEn, 'utf8');
    swaggerDocumentEn = yaml.parse(fileContentEn);

    const fileContentEt = await readFile(openApiPathEt, 'utf8');
    swaggerDocumentEt = yaml.parse(fileContentEt);

    console.log('✅ OpenAPI files loaded successfully');
} catch (error) {
    console.error('❌ Failed to load OpenAPI files:', error);
    process.exit(1); // Peatab rakenduse, kui fail puudub
}

const app = express();
app.use(express.json());

// Avaleht keelevalikuga
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="">
    <head>
        <title>API Documentation / API Dokumentatsioon</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; }
            a { display: inline-block; padding: 10px 15px; background-color: #f5f5f5; 
                color: #333; text-decoration: none; border-radius: 4px; }
            a:hover { background-color: #e0e0e0; }
        </style>
    </head>
    <body>
        <h1>Choose language / Vali keel</h1>
        <ul>
            <li><a href="/en">English</a></li>
            <li><a href="/et">Eesti keel</a></li>
        </ul>
    </body>
    </html>
    `);
});

// Mitmekeelne Swagger UI konfiguratsioon
app.use('/en', swaggerUi.serve, swaggerUi.setup(swaggerDocumentEn, {
    customCss: '.topbar { display: none }',
    customSiteTitle: "API Documentation",
}));

app.use('/et', swaggerUi.serve, swaggerUi.setup(swaggerDocumentEt, {
    customCss: '.topbar { display: none }',
    customSiteTitle: "API Dokumentatsioon",
}));

// Suuna ka /api-docs -> /docs/en (tagasiühilduvuse jaoks)
app.get('/api-docs', (req, res) => {
    res.redirect('/en');
});

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📜 Documentation available at:`);
    console.log(`   - English: http://localhost:${PORT}/en`);
    console.log(`   - Estonian: http://localhost:${PORT}/et`);
    console.log(`   - Language selection: http://localhost:${PORT}/`);
});