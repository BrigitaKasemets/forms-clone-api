import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { FormsController } from '../controllers/formsController.js';

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

// API endpoints using FormsController methods
router.post('/', authenticateToken, validateForm, FormsController.createForm);
router.get('/', authenticateToken, FormsController.getForms);
router.get('/:id', authenticateToken, FormsController.getFormById);
router.patch('/:id', authenticateToken, validateForm, FormsController.updateForm);
router.delete('/:id', authenticateToken, FormsController.deleteForm);

export default router;