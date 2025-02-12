import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
    res.status(200).json([]);
});

router.post('/', authenticateToken, (req, res) => {
    const { title, description } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    res.status(201).json({
        id: 'new-form-id',
        title,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

router.get('/:formId', authenticateToken, (req, res) => {
    res.status(200).json({
        id: req.params.formId,
        title: "Sample Form",
        description: "A sample form",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

router.patch('/:formId', authenticateToken, (req, res) => {
    const { title, description } = req.body;
    res.status(200).json({
        id: req.params.formId,
        title: title || "Sample Form",
        description: description || "A sample form",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

router.delete('/:formId', authenticateToken, (req, res) => {
    res.status(204).send();
});

export default router;
