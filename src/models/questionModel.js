// models/questions.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Function to get database connection
const getDb = async () => {
  return await open({
    filename: 'forms.db',
    driver: sqlite3.Database
  });
};

export const QuestionModel = {
  create: async (formId, questionData) => {
    const db = await getDb();
    
    try {
      // First check if the form exists
      const formExists = await db.get('SELECT id FROM forms WHERE id = ?', [formId]);
      if (!formExists) {
        throw new Error('Form not found');
      }
      
      // Convert options array to JSON string if it exists
      const options = questionData.options ? JSON.stringify(questionData.options) : null;
      
      const result = await db.run(
        `INSERT INTO questions 
        (form_id, question_text, question_type, required, options) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          formId, 
          questionData.text, 
          questionData.type, 
          questionData.required || false,
          options
        ]
      );
      
      // Get the created question
      const question = await db.get(
        'SELECT * FROM questions WHERE id = ?', 
        [result.lastID]
      );
      
      // Parse options back to array if it exists
      return {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        required: Boolean(question.required),
        options: question.options ? JSON.parse(question.options) : [],
        createdAt: question.created_at,
        updatedAt: question.updated_at
      };
    } finally {
      await db.close();
    }
  },
  
  findAll: async (formId) => {
    const db = await getDb();
    
    try {
      // First check if the form exists
      const formExists = await db.get('SELECT id FROM forms WHERE id = ?', [formId]);
      if (!formExists) {
        throw new Error('Form not found');
      }
      
      const questions = await db.all(
        'SELECT * FROM questions WHERE form_id = ? ORDER BY id',
        [formId]
      );
      
      // Format the response
      return questions.map(q => ({
        id: q.id,
        text: q.question_text,
        type: q.question_type,
        required: Boolean(q.required),
        options: q.options ? JSON.parse(q.options) : [],
        createdAt: q.created_at,
        updatedAt: q.updated_at
      }));
    } finally {
      await db.close();
    }
  },
  
  findById: async (formId, questionId) => {
    const db = await getDb();
    
    try {
      const question = await db.get(
        'SELECT * FROM questions WHERE id = ? AND form_id = ?',
        [questionId, formId]
      );
      
      if (!question) {
        return null;
      }
      
      return {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        required: Boolean(question.required),
        options: question.options ? JSON.parse(question.options) : [],
        createdAt: question.created_at,
        updatedAt: question.updated_at
      };
    } finally {
      await db.close();
    }
  },
  
  update: async (formId, questionId, questionData) => {
    const db = await getDb();
    
    try {
      // First check if the question exists
      const questionExists = await db.get(
        'SELECT id FROM questions WHERE id = ? AND form_id = ?',
        [questionId, formId]
      );
      
      if (!questionExists) {
        return null;
      }
      
      // Build the update query dynamically based on provided fields
      const updates = [];
      const params = [];
      
      if (questionData.text !== undefined) {
        updates.push('question_text = ?');
        params.push(questionData.text);
      }
      
      if (questionData.type !== undefined) {
        updates.push('question_type = ?');
        params.push(questionData.type);
      }
      
      if (questionData.required !== undefined) {
        updates.push('required = ?');
        params.push(questionData.required);
      }
      
      if (questionData.options !== undefined) {
        updates.push('options = ?');
        params.push(JSON.stringify(questionData.options));
      }
      
      if (updates.length === 0) {
        // No fields to update
        return await QuestionModel.findById(formId, questionId);
      }
      
      // Add updated_at timestamp and query parameters
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(questionId, formId);
      
      await db.run(
        `UPDATE questions SET ${updates.join(', ')} WHERE id = ? AND form_id = ?`,
        params
      );
      
      return await QuestionModel.findById(formId, questionId);
    } finally {
      await db.close();
    }
  },
  
  delete: async (formId, questionId) => {
    const db = await getDb();
    
    try {
      // First check if the question exists
      const questionExists = await db.get(
        'SELECT id FROM questions WHERE id = ? AND form_id = ?',
        [questionId, formId]
      );
      
      if (!questionExists) {
        return false;
      }
      
      await db.run(
        'DELETE FROM questions WHERE id = ? AND form_id = ?',
        [questionId, formId]
      );
      
      return true;
    } finally {
      await db.close();
    }
  }
};