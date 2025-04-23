import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { FormModel } from '../models/formModel.js';

const router = express.Router();

// Validation middleware for forms
const validateForm = (req, res, next) => {
    const { title, description } = req.body;
    const errors = [];

    if (!title) {
        errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!description) {
        errors.push({ field: 'description', message: 'Description is required' });
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

// Create a new form
router.post('/', authenticateToken, validateForm, async (req, res) => {
    try {
        const form = await FormModel.create(req.body);
        res.status(201).json(form);
    } catch (error) {
        res.status(500).json({ 
            code: 500, 
            message: 'Internal server error', 
            details: [{ message: error.message }] 
        });
    }
});

// Get all forms with pagination
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const forms = await FormModel.findAll(page, limit);
        res.status(200).json(forms);
    } catch (error) {
        res.status(500).json({ 
            code: 500, 
            message: 'Internal server error', 
            details: [{ message: error.message }] 
        });
    }
});

// Get a specific form by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const form = await FormModel.findById(req.params.id);
        if (!form) {
            return res.status(404).json({ 
                code: 404, 
                message: 'Form not found', 
                details: [{ message: `Form with ID ${req.params.id} does not exist` }] 
            });
        }
        res.status(200).json(form);
    } catch (error) {
        res.status(500).json({ 
            code: 500, 
            message: 'Internal server error', 
            details: [{ message: error.message }] 
        });
    }
});

// Update an existing form
router.patch('/:id', authenticateToken, validateForm, async (req, res) => {
    try {
        const form = await FormModel.update(req.params.id, req.body);
        if (!form) {
            return res.status(404).json({ 
                code: 404, 
                message: 'Form not found', 
                details: [{ message: `Form with ID ${req.params.id} does not exist` }] 
            });
        }
        res.status(200).json(form);
    } catch (error) {
        res.status(500).json({ 
            code: 500, 
            message: 'Internal server error', 
            details: [{ message: error.message }] 
        });
    }
});

// Delete a form
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deleted = await FormModel.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ 
                code: 404, 
                message: 'Form not found', 
                details: [{ message: `Form with ID ${req.params.id} does not exist` }] 
            });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ 
            code: 500, 
            message: 'Internal server error', 
            details: [{ message: error.message }] 
        });
    }
});

export default router;