import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List all responses for a form
router.get('/:formId/responses', authenticateToken, (req, res) => {
    res.status(200).json([]);
});

// Create new response
router.post('/:formId/responses', authenticateToken, (req, res) => {
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Answers array is required' });
    }

    res.status(201).json({
        id: 'new-response-id',
        formId: req.params.formId,
        answers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Get response by ID
router.get('/:formId/responses/:responseId', authenticateToken, (req, res) => {
    res.status(200).json({
        id: req.params.responseId,
        formId: req.params.formId,
        answers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Update response
router.patch('/:formId/responses/:responseId', authenticateToken, (req, res) => {
    const { answers } = req.body;
    res.status(200).json({
        id: req.params.responseId,
        formId: req.params.formId,
        answers: answers || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Delete response
router.delete('/:formId/responses/:responseId', authenticateToken, (req, res) => {
    res.status(204).send();
});

export default router;