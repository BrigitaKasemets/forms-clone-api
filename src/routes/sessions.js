import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

export const router = express.Router();

// Temporary storage (replace with database in production)
let sessions = [];

// Create new session (login)
router.post('/', async (req, res) => {
    try {
        const { email, password, device_info } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                code: 400,
                message: 'Validation failed',
                details: [
                    !email && { field: 'email', message: 'Email is required' },
                    !password && { field: 'password', message: 'Password is required' }
                ].filter(Boolean)
            });
        }

        // In production, get user from database
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({
                code: 401,
                message: 'Invalid credentials',
                details: [{ message: 'Email or password is incorrect' }]
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                code: 401,
                message: 'Invalid credentials',
                details: [{ message: 'Email or password is incorrect' }]
            });
        }

        // Create session
        const session = {
            id: uuidv4(),
            user_id: user.id,
            device_info,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            is_active: true
        };

        sessions.push(session);

        // Generate JWT
        const token = jwt.sign(
            { user_id: user.id, session_id: session.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});

// End session (logout)
router.delete('/:sessionId', authenticateToken, (req, res) => {
    try {
        const sessionIndex = sessions.findIndex(
            s => s.id === req.params.sessionId && s.user_id === req.user.id
        );

        if (sessionIndex === -1) {
            return res.status(404).json({
                code: 404,
                message: 'Session not found',
                details: [{ message: `Session with ID ${req.params.sessionId} does not exist or does not belong to current user` }]
            });
        }

        // Mark session as inactive
        sessions[sessionIndex].is_active = false;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            details: [{ message: error.message }]
        });
    }
});