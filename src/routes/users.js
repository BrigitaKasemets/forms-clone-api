import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

export const router = express.Router();

// Temporary storage (replace with database in production)
let users = [];

// Register new user
router.post('/', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            return res.status(400).json({
                code: 400,
                message: 'Validation failed',
                details: [
                    !email && { field: 'email', message: 'Email is required' },
                    !password && { field: 'password', message: 'Password is required' },
                    !name && { field: 'name', message: 'Name is required' }
                ].filter(Boolean)
            });
        }

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({
                code: 400,
                message: 'Validation failed',
                details: [{ field: 'email', message: 'Email already exists' }]
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            id: uuidv4(),
            email,
            name,
            password: hashedPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        users.push(user);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({
                code: 404,
                message: 'User not found',
                details: [{ message: 'Current user not found' }]
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Update current user profile
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const { name, password } = req.body;

        // Validate required fields
        if (!name || !password) {
            return res.status(400).json({
                code: 400,
                message: 'Validation failed',
                details: [
                    !name && { field: 'name', message: 'Name is required' },
                    !password && { field: 'password', message: 'Password is required' }
                ].filter(Boolean)
            });
        }

        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({
                code: 404,
                message: 'User not found',
                details: [{ message: 'Current user not found' }]
            });
        }

        // Update user
        users[userIndex] = {
            ...users[userIndex],
            name,
            password: await bcrypt.hash(password, 10),
            updated_at: new Date().toISOString()
        };

        const { password: _, ...userWithoutPassword } = users[userIndex];
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Get all users
router.get('/', authenticateToken, (req, res) => {
    try {
        const usersWithoutPasswords = users.map(user => {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(usersWithoutPasswords);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({
                code: 404,
                message: 'User not found',
                details: [{ message: `User with ID ${req.params.id} does not exist` }]
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// Delete user
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const userIndex = users.findIndex(u => u.id === req.params.id);
        if (userIndex === -1) {
            return res.status(404).json({
                code: 404,
                message: 'User not found',
                details: [{ message: `User with ID ${req.params.id} does not exist` }]
            });
        }

        users = users.filter(u => u.id !== req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});