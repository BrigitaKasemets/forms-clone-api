// models/responses.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Function to get database connection
const getDb = async () => {
  return await open({
    filename: 'forms.db',
    driver: sqlite3.Database
  });
};

export const ResponseModel = {
  // Create a new response for a form
  create: async (formId, responseData) => {
    const db = await getDb();
    
    try {
      // Begin transaction
      await db.run('BEGIN TRANSACTION');
      
      // First check if the form exists
      const formExists = await db.get('SELECT id FROM forms WHERE id = ?', [formId]);
      if (!formExists) {
        throw new Error('Form not found');
      }
      
      // Validate that answers are provided
      if (!responseData.answers || !Array.isArray(responseData.answers) || responseData.answers.length === 0) {
        throw new Error('At least one answer is required');
      }
      
      // Insert the response record
      const currentTime = new Date().toISOString();
      const responseResult = await db.run(
        `INSERT INTO responses (form_id, respondent_name, respondent_email, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          formId,
          responseData.respondentName || null,
          responseData.respondentEmail || null,
          currentTime,
          currentTime
        ]
      );
      
      const responseId = responseResult.lastID;
      
      // Insert each answer
      for (const answer of responseData.answers) {
        // Verify the question exists
        const questionExists = await db.get(
          'SELECT id FROM questions WHERE id = ? AND form_id = ?', 
          [answer.questionId, formId]
        );
        
        if (!questionExists) {
          await db.run('ROLLBACK');
          throw new Error(`Question with ID ${answer.questionId} not found`);
        }
        
        // Insert the answer
        await db.run(
          `INSERT INTO answer_values (response_id, question_id, answer_text) 
           VALUES (?, ?, ?)`,
          [responseId, answer.questionId, answer.answer]
        );
      }
      
      // Commit the transaction
      await db.run('COMMIT');
      
      // Get the complete response with answers
      return await ResponseModel.findById(formId, responseId);
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      throw error;
    } finally {
      await db.close();
    }
  },
  
  // Find all responses for a form
  findAll: async (formId) => {
    const db = await getDb();
    
    try {
      // First check if the form exists
      const formExists = await db.get('SELECT id FROM forms WHERE id = ?', [formId]);
      if (!formExists) {
        throw new Error('Form not found');
      }
      
      // Get all responses for the form
      const responses = await db.all(
        'SELECT * FROM responses WHERE form_id = ? ORDER BY created_at DESC',
        [formId]
      );
      
      // Get all answers for these responses
      const result = [];
      
      for (const response of responses) {
        const answers = await db.all(
          `SELECT question_id, answer_text AS answer 
           FROM answer_values 
           WHERE response_id = ?`,
          [response.id]
        );
        
        result.push({
          id: response.id.toString(),
          formId: response.form_id.toString(),
          respondentName: response.respondent_name,
          respondentEmail: response.respondent_email,
          answers: answers.map(a => ({
            questionId: a.question_id.toString(),
            answer: a.answer
          })),
          createdAt: response.created_at,
          updatedAt: response.updated_at
        });
      }
      
      return result;
    } finally {
      await db.close();
    }
  },
  
  // Find a specific response by ID
  findById: async (formId, responseId) => {
    const db = await getDb();
    
    try {
      // Get the response
      const response = await db.get(
        'SELECT * FROM responses WHERE id = ? AND form_id = ?',
        [responseId, formId]
      );
      
      if (!response) {
        return null;
      }
      
      // Get all answers for this response
      const answers = await db.all(
        `SELECT question_id, answer_text AS answer 
         FROM answer_values 
         WHERE response_id = ?`,
        [responseId]
      );
      
      return {
        id: response.id.toString(),
        formId: response.form_id.toString(),
        respondentName: response.respondent_name,
        respondentEmail: response.respondent_email,
        answers: answers.map(a => ({
          questionId: a.question_id.toString(),
          answer: a.answer
        })),
        createdAt: response.created_at,
        updatedAt: response.updated_at
      };
    } finally {
      await db.close();
    }
  },
  
  // Update a response
  update: async (formId, responseId, responseData) => {
    const db = await getDb();
    
    try {
      // Begin transaction
      await db.run('BEGIN TRANSACTION');
      
      // Check if the response exists
      const responseExists = await db.get(
        'SELECT id FROM responses WHERE id = ? AND form_id = ?',
        [responseId, formId]
      );
      
      if (!responseExists) {
        return null;
      }
      
      // Update respondent info if provided and set updated_at timestamp
      let updates = ['updated_at = CURRENT_TIMESTAMP'];
      let params = [];
      
      if (responseData.respondentName !== undefined) {
        updates.push('respondent_name = ?');
        params.push(responseData.respondentName);
      }
      
      if (responseData.respondentEmail !== undefined) {
        updates.push('respondent_email = ?');
        params.push(responseData.respondentEmail);
      }
      
      params.push(responseId);
      await db.run(
        `UPDATE responses SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      
      // Update answers if provided
      if (responseData.answers && Array.isArray(responseData.answers)) {
        // Delete existing answers
        await db.run('DELETE FROM answer_values WHERE response_id = ?', [responseId]);
        
        // Insert new answers
        for (const answer of responseData.answers) {
          // Verify the question exists
          const questionExists = await db.get(
            'SELECT id FROM questions WHERE id = ? AND form_id = ?', 
            [answer.questionId, formId]
          );
          
          if (!questionExists) {
            await db.run('ROLLBACK');
            throw new Error(`Question with ID ${answer.questionId} not found`);
          }
          
          // Insert the answer
          await db.run(
            `INSERT INTO answer_values (response_id, question_id, answer_text) 
             VALUES (?, ?, ?)`,
            [responseId, answer.questionId, answer.answer]
          );
        }
      }
      
      // Commit the transaction
      await db.run('COMMIT');
      
      // Get the updated response
      return await ResponseModel.findById(formId, responseId);
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      throw error;
    } finally {
      await db.close();
    }
  },
  
  // Delete a response
  delete: async (formId, responseId) => {
    const db = await getDb();
    
    try {
      // Check if the response exists
      const responseExists = await db.get(
        'SELECT id FROM responses WHERE id = ? AND form_id = ?',
        [responseId, formId]
      );
      
      if (!responseExists) {
        return false;
      }
      
      // Begin transaction
      await db.run('BEGIN TRANSACTION');
      
      // Delete all answers
      await db.run('DELETE FROM answer_values WHERE response_id = ?', [responseId]);
      
      // Delete the response
      await db.run('DELETE FROM responses WHERE id = ?', [responseId]);
      
      // Commit the transaction
      await db.run('COMMIT');
      
      return true;
    } catch (error) {
      // Rollback on error
      await db.run('ROLLBACK');
      throw error;
    } finally {
      await db.close();
    }
  }
};