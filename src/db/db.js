import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database connection (without creating tables)
const initializeDb = async () => {
    return await open({
        filename: path.join(__dirname, '../../forms.db'),
        driver: sqlite3.Database
    });
};

// User management functions
export const userDb = {
    async createUser(email, password, name) {
        const db = await initializeDb();

        // Check if email already exists
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            throw new Error('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [email, hashedPassword, name]
        );

        // Return the created user
        return {
            id: result.lastID,
            email,
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    async getAllUsers() {
        const db = await initializeDb();
        const users = await db.all('SELECT id, email, name, created_at as createdAt, updated_at as updatedAt FROM users');
        return users;
    },

    async verifyUser(email, password) {
        const db = await initializeDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return null;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name
        };
    },

    async getUserById(userId) {
        const db = await initializeDb();
        const user = await db.get(
            'SELECT id, email, name, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    },

    async updateUser(userId, updates) {
        const db = await initializeDb();

        // Verify user exists
        await this.getUserById(userId);

        // Build the SQL update parts
        const updateFields = [];
        const values = [];

        if (updates.email) {
            updateFields.push('email = ?');
            values.push(updates.email);
        }

        if (updates.name) {
            updateFields.push('name = ?');
            values.push(updates.name);
        }

        // Always update the updated_at timestamp
        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        // Add userId to values array for the WHERE clause
        values.push(userId);

        // Only proceed if there are fields to update
        if (updateFields.length > 0) {
            const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
            await db.run(query, values);
        }

        // Return the updated user
        return await this.getUserById(userId);
    }
};

// Session management functions
export const sessionDb = {
    async createSession(userId, token) {
        const db = await initializeDb();
        await db.run(
            'INSERT INTO sessions (token, user_id) VALUES (?, ?)',
            [token, userId]
        );
        return token;
    },

    async verifySession(token) {
        const db = await initializeDb();
        const session = await db.get(
            `SELECT s.*, u.email, u.name
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.token = ?`,
            [token]
        );
        return session;
    },

    async deleteSession(token) {
        const db = await initializeDb();
        await db.run('DELETE FROM sessions WHERE token = ?', [token]);
    }
};

// Form management functions
export const formDb = {
    async createForm(userId, title, description) {
        const db = await initializeDb();
        const result = await db.run(
            'INSERT INTO forms (user_id, title, description) VALUES (?, ?, ?)',
            [userId, title, description]
        );
        return { id: result.lastID, userId, title, description };
    },

    async getAllForms() {
        const db = await initializeDb();
        const forms = await db.all('SELECT * FROM forms');
        return forms;
    },

    async getFormById(formId) {
        const db = await initializeDb();
        const form = await db.get('SELECT * FROM forms WHERE id = ?', [formId]);

        if (!form) {
            throw new Error('Form not found');
        }

        return form;
    },

    async updateForm(formId, title, description) {
        const db = await initializeDb();

        // First check if the form exists
        const formExists = await this.getFormById(formId);

        if (!formExists) {
            throw new Error('Form not found');
        }

        await db.run(
            'UPDATE forms SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, description, formId]
        );

        return await this.getFormById(formId);
    },

    async deleteForm(formId) {
        const db = await initializeDb();

        // First check if the form exists
        const formExists = await db.get('SELECT id FROM forms WHERE id = ?', [formId]);

        if (!formExists) {
            return false;
        }

        await db.run('DELETE FROM forms WHERE id = ?', [formId]);
        return true;
    }
};