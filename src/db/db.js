import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database connection (without creating tables)
export const initializeDb = async () => {
    return await open({
        filename: path.join(__dirname, '../../forms.db'),
        driver: sqlite3.Database
    });
};

/**
 * Execute database operations with automatic connection management
 * @param {Function} callback - Async function that receives db connection and performs operations
 * @returns {Promise<*>} - The result of the callback function
 */
export const withDb = async (callback) => {
    const db = await initializeDb();
    try {
        return await callback(db);
    } finally {
        await db.close();
    }
};

// User management functions
export const userDb = {
    async createUser(email, password, name) {
        return withDb(async (db) => {
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

            // Get the created user with timestamps from database
            const createdUser = await db.get(
                'SELECT id, email, name, createdAt, updatedAt FROM users WHERE id = ?',
                [result.lastID]
            );
            
            return createdUser;
        });
    },

    async getAllUsers() {
        return withDb(async (db) => {
            return await db.all('SELECT id, email, name, createdAt as createdAt, updatedAt as updatedAt FROM users');
        });
    },

    async verifyUser(email, password) {
        return withDb(async (db) => {
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
        });
    },

    async getUserById(userId) {
        return withDb(async (db) => {
            const user = await db.get(
                'SELECT id, email, name, createdAt as createdAt, updatedAt as updatedAt FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        });
    },

    async updateUser(userId, updates) {
        return withDb(async (db) => {
            // Verify user exists
            const user = await db.get(
                'SELECT id FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                throw new Error('User not found');
            }

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

            // Always update the updatedAt timestamp
            updateFields.push('updatedAt = CURRENT_TIMESTAMP');

            // Add userId to values array for the WHERE clause
            values.push(userId);

            // Only proceed if there are fields to update
            if (updateFields.length > 0) {
                const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
                await db.run(query, values);
            }

            // Get and return the updated user
            const updatedUser = await db.get(
                'SELECT id, email, name, createdAt as createdAt, updatedAt as updatedAt FROM users WHERE id = ?',
                [userId]
            );
            
            return updatedUser;
        });
    }
};

// Session management functions
export const sessionDb = {
    async createSession(userId, token) {
        return withDb(async (db) => {
            await db.run(
                'INSERT INTO sessions (token, userId) VALUES (?, ?)',
                [token, userId]
            );
            return token;
        });
    },

    async verifySession(token) {
        return withDb(async (db) => {
            const session = await db.get(
                `SELECT s.*, u.email, u.name
                 FROM sessions s
                 JOIN users u ON s.userId = u.id
                 WHERE s.token = ?`,
                [token]
            );
            return session;
        });
    },

    async deleteSession(token) {
        return withDb(async (db) => {
            await db.run('DELETE FROM sessions WHERE token = ?', [token]);
        });
    }
};

// Form management functions
export const formDb = {
    async createForm(userId, title, description) {
        return withDb(async (db) => {
            const result = await db.run(
                'INSERT INTO forms (userId, title, description) VALUES (?, ?, ?)',
                [userId, title, description]
            );
            // Return the created form with timestamps from database
            return await db.get('SELECT * FROM forms WHERE id = ?', [result.lastID]);
        });
    },

    async getAllForms() {
        return withDb(async (db) => {
            return await db.all('SELECT * FROM forms');
        });
    },

    async getFormById(formId) {
        return withDb(async (db) => {
            const form = await db.get('SELECT * FROM forms WHERE id = ?', [formId]);

            if (!form) {
                throw new Error('Form not found');
            }

            return form;
        });
    },

    async updateForm(formId, title, description) {
        return withDb(async (db) => {
            // First check if the form exists
            const form = await db.get('SELECT * FROM forms WHERE id = ?', [formId]);

            if (!form) {
                throw new Error('Form not found');
            }

            await db.run(
                'UPDATE forms SET title = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
                [title, description, formId]
            );

            // Get the updated form details
            const updatedForm = await db.get('SELECT * FROM forms WHERE id = ?', [formId]);
            return updatedForm;
        });
    },

    async deleteForm(formId) {
        return withDb(async (db) => {
            // First check if the form exists
            const formExists = await db.get('SELECT id FROM forms WHERE id = ?', [formId]);

            if (!formExists) {
                return false;
            }

            await db.run('DELETE FROM forms WHERE id = ?', [formId]);
            return true;
        });
    }
};