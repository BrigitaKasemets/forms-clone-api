import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

export const router = express.Router();

// Temporary storage (replace with database in production)
let forms = [];

// Validation middleware
const validateForm = (req, res, next) => {
    const { title, description, questions } = req.body;
    const errors = [];

    if (!title) {
        errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!description) {
        errors.push({ field: 'description', message: 'Description is required' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        errors.push({ field: 'questions', message: 'At least one question is required' });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            code: 400,
            message: 'Validation failed',
            details: errors
        });
    }

    next();
};

// Create form
router.post('/', authenticateToken, validateForm, (req, res) => {
    try {
        const form = {
            id: uuidv4(),
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        forms.push(form);
        res.status(201).json(form);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Get all forms
router.get('/', authenticateToken, (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const paginatedForms = forms.slice(startIndex, endIndex);

        res.json({
            data: paginatedForms,
            pagination: {
                total: forms.length,
                page,
                pages: Math.ceil(forms.length / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Get form by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const form = forms.find(f => f.id === req.params.id);
        if (!form) {
            return res.status(404).json({
                code: 404,
                message: 'Form not found',
                details: [{ message: `Form with ID ${req.params.id} does not exist` }]
            });
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Update form
router.put('/:id', authenticateToken, validateForm, (req, res) => {
    try {
        const index = forms.findIndex(f => f.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({
                code: 404,
                message: 'Form not found',
                details: [{ message: `Form with ID ${req.params.id} does not exist` }]
            });
        }

        forms[index] = {
            ...forms[index],
            ...req.body,
            updated_at: new Date().toISOString()
        };

        res.json(forms[index]);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Delete form
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const index = forms.findIndex(f => f.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({
                code: 404,
                message: 'Form not found',
                details: [{ message: `Form with ID ${req.params.id} does not exist` }]
            });
        }

        forms = forms.filter(f => f.id !== req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Submit form response
router.post('/:id/responses', authenticateToken, async (req, res) => {
    try {
        const form = forms.find(f => f.id === req.params.id);
        if (!form) {
            return res.status(404).json({
                code: 404,
                message: 'Form not found',
                details: [{ message: `Form with ID ${req.params.id} does not exist` }]
            });
        }

        // Validate required answers
        const requiredQuestions = form.questions.filter(q => q.required);
        const providedAnswers = req.body.answers || [];
        const missingAnswers = requiredQuestions.filter(q =>
            !providedAnswers.find(a => a.question_id === q.id)
        );

        if (missingAnswers.length > 0) {
            return res.status(400).json({
                code: 400,
                message: 'Missing required answers',
                details: missingAnswers.map(q => ({
                    field: 'answers',
                    message: `Answer for question "${q.title}" is required`
                }))
            });
        }

        const response = {
            id: uuidv4(),
            form_id: form.id,
            ...req.body,
            submitted_at: new Date().toISOString()
        };

        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Get form responses
router.get('/:id/responses', authenticateToken, (req, res) => {
    try {
        const form = forms.find(f => f.id === req.params.id);
        if (!form) {
            return res.status(404).json({
                code: 404,
                message: 'Form not found',
                details: [{ message: `Form with ID ${req.params.id} does not exist` }]
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // In a real application, you would fetch this from a database
        res.json({
            data: [],
            pagination: {
                total: 0,
                page,
                pages: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});