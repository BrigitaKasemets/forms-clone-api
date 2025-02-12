import express from 'express';
import { FormsController } from '../controllers/forms.js';
import { authenticateToken } from '../middleware/auth.js';

export const router = express.Router();

// Validation middleware
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

// Routes
router.post('/', authenticateToken, validateForm, FormsController.create);
router.get('/', authenticateToken, FormsController.list);
router.get('/:id', authenticateToken, FormsController.getById);
router.put('/:id', authenticateToken, validateForm, FormsController.update);
router.delete('/:id', authenticateToken, FormsController.delete);
