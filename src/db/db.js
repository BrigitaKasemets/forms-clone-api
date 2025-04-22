// src/db/db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

// Initialize database
const initializeDb = async () => {
    const db = await open({
        filename: 'forms.db',
        driver: sqlite3.Database
    });

    // Create users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create sessions table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Create forms table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);
    return db;
};

// User management functions
export const userDb = {
    async createUser(email, password, name) {
        const db = await initializeDb();
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const result = await db.run(
                'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                [email, hashedPassword, name]
            );
            return { id: result.lastID, email, name };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    },

    async getAllUsers() {
        const db = await initializeDb();
        const users = await db.all('SELECT id, email, name, created_at, updated_at FROM users');
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
        const user = await db.get('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
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

// Initialize database when this module is imported
initializeDb().then(() => {
    console.log('✅ Database initialized successfully');
}).catch(error => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
});