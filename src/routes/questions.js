import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:formId/questions', authenticateToken, (req, res) => {
    res.status(200).json([]);
});

router.post('/:formId/questions', authenticateToken, (req, res) => {
    res.status(201).json({ id: 'new-question-id', ...req.body });
});

router.get('/:formId/questions/:questionId', authenticateToken, (req, res) => {
    res.status(200).json({
        id: req.params.questionId,
        text: "Sample Question",
        type: "shorttext"
    });
});

router.patch('/:formId/questions/:questionId', authenticateToken, (req, res) => {
    res.status(200).json({
        id: req.params.questionId,
        ...req.body
    });
});

router.delete('/:formId/questions/:questionId', authenticateToken, (req, res) => {
    res.status(204).send();
});

export default router; 