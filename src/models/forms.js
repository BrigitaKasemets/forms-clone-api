import { v4 as uuidv4 } from 'uuid';

// Temporary storage (replace with database in production)
let forms = [];

export const FormModel = {
    create: async (formData) => {
        const form = {
            id: uuidv4(),
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        forms.push(form);
        return form;
    },

    findAll: async (page = 1, limit = 10) => {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedForms = forms.slice(startIndex, endIndex);

        return {
            data: paginatedForms,
            pagination: {
                total: forms.length,
                page,
                pages: Math.ceil(forms.length / limit)
            }
        };
    },

    findById: async (id) => {
        return forms.find(f => f.id === id);
    },

    update: async (id, formData) => {
        const index = forms.findIndex(f => f.id === id);
        if (index === -1) return null;

        forms[index] = {
            ...forms[index],
            ...formData,
            updated_at: new Date().toISOString()
        };

        return forms[index];
    },

    delete: async (id) => {
        const index = forms.findIndex(f => f.id === id);
        if (index === -1) return false;

        forms = forms.filter(f => f.id !== id);
        return true;
    }
}; 