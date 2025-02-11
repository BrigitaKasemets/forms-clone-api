import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

// Mock Routes
app.post('/sessions', (req, res) => {
    res.status(201).json({ token: "mockToken", userId: "12345" });
});

app.get('/sessions', (req, res) => {
    res.status(200).json({ token: "mockToken", userId: "12345" });
});

app.delete('/sessions', (req, res) => {
    res.status(204).send();
});

app.get('/forms', (req, res) => {
    res.status(200).json([]);
});

app.post('/forms', (req, res) => {
    res.status(201).json(req.body);
});

// Dynamic Route Example
app.get('/forms/:formId', (req, res) => {
    res.status(200).json({ id: req.params.formId, title: "Sample Form" });
});

app.patch('/forms/:formId', (req, res) => {
    res.status(200).json({ id: req.params.formId, ...req.body });
});

app.delete('/forms/:formId', (req, res) => {
    res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📜 Swagger docs available at http://localhost:${PORT}/api-docs`);
});