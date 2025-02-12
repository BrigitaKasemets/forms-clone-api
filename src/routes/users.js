import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { userDb } from '../db/db.js';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, (req, res) => {
    res.status(200).json([]);
});

// Register new user
router.post('/', async (req, res) => {
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

// Get user by ID
router.get('/:userId', authenticateToken, (req, res) => {
    res.status(200).json({
        id: req.params.userId,
        email: "user@example.com",
        name: "Sample User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Update user
router.patch('/:userId', authenticateToken, (req, res) => {
    const { email, name } = req.body;
    res.status(200).json({
        id: req.params.userId,
        email: email || "user@example.com",
        name: name || "Sample User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
});

// Delete user
router.delete('/:userId', authenticateToken, (req, res) => {
    res.status(204).send();
});

export default router;