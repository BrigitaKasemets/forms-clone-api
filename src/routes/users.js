import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { userDb } from '../db/db.js';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await userDb.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new user
router.post('/', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                message: 'Missing required fields: email, password, and name are required'
            });
        }

        const user = await userDb.createUser(email, password, name);

        // Return user with original timestamps
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'Email already exists') {
            res.status(409).json({ error: error.message });
        } else {
            console.error('User creation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Get user by ID
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const user = await userDb.getUserById(req.params.userId);
        res.status(200).json(user);
    } catch (error) {
        if (error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        } else {
            console.error('Error fetching user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Update user
router.patch('/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { email, name } = req.body;

        // Update the user
        const updatedUser = await userDb.updateUser(userId, { email, name });

        // Return user with database-provided timestamps
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error.message === 'User not found') {
            res.status(404).json({ error: 'User not found' });
        } else {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Delete user
router.delete('/:userId', authenticateToken, (req, res) => {
    res.status(204).send();
});

export default router;