import { formDb } from '../db/db.js';

export const FormModel = {
    create: async (formData) => {
        // Make sure user_id is available in the formData
        if (!formData.user_id) {
            throw new Error('User ID is required to create a form');
        }

        const form = await formDb.createForm(
            formData.user_id,
            formData.title, 
            formData.description
        );
        
        return {
            id: form.id,
            title: form.title,
            description: form.description,
            user_id: form.userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    },

    findAll: async () => {
        try {
            const forms = await formDb.getAllForms();
            return forms; // Add this return statement
        } catch (error) {
            console.error('Error fetching forms:', error);
            throw error;
        }
    },

    findById: async (id) => {
        try {
            return await formDb.getFormById(id);
        } catch (error) {
            if (error.message === 'Form not found') {
                return null;
            }
            throw error;
        }
    },

    update: async (id, formData) => {
        try {
            const updatedForm = await formDb.updateForm(
                id, 
                formData.title, 
                formData.description
            );
            return updatedForm;
        } catch (error) {
            if (error.message === 'Form not found') {
                return null;
            }
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await formDb.deleteForm(id);
        } catch (error) {
            console.error('Error deleting form:', error);
            return false;
        }
    }    
};