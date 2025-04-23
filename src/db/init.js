// src/db/init.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize the database connection
const initDb = async () => {
  console.log('Initializing database...');
  
  try {
    // Open database connection
    const db = await open({
      filename: path.join(__dirname, '../../forms.db'),
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
    console.log('Users table created');

    // Create sessions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    console.log('Sessions table created');

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
    console.log('Forms table created');

    // Create questions table if not already defined in the schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        required BOOLEAN DEFAULT FALSE,
        options TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
      )
    `);
    console.log('Questions table created');

    // Create responses table if not already defined in the schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_id INTEGER NOT NULL,
        respondent_name TEXT,
        respondent_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (form_id) REFERENCES forms (id) ON DELETE CASCADE
      )
    `);
    console.log('Responses table created');
    

    // Create answer_values table for storing individual question answers
    await db.exec(`
      CREATE TABLE IF NOT EXISTS answer_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        response_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        answer_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (response_id) REFERENCES responses (id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
      )
    `);
    console.log('Answer values table created');

    // Create an admin user for testing
    const adminExists = await db.get('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        ['admin@example.com', hashedPassword, 'Admin User']
      );
      console.log('Admin user created with email: admin@example.com and password: password123');
    }

    console.log('✅ Database initialization completed successfully!');
    
    // Close the database connection
    await db.close();
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
};

// Execute the initialization
initDb();