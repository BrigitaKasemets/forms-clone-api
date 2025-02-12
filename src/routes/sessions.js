import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { sessions } from '../middleware/auth.js';
import { userDb } from '../db/db.js';

const router = express.Router();

// Create new session (login)
router.post('/', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userDb.verifyUser(email, password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const session = await sessions.create(user.id);
        res.status(201).json({
            token: session.token,
            userId: user.id
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete session (logout)
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await sessions.remove(req.user.token);
        res.status(204).send();
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;