import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { FormModel } from '../models/forms.js';

// Loome express routeri, et defineerida teed
export const router = express.Router();

// Validation middleware - kontrollib, kas vormi andmed on õiged
const validateForm = (req, res, next) => {
    const { title, description, questions } = req.body;
    const errors = [];

    // Kontrollime, kas kõik vajalikud andmed on olemas
    if (!title) {
        errors.push({ field: 'title', message: 'Title is required' });
    }

    if (!description) {
        errors.push({ field: 'description', message: 'Description is required' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        errors.push({ field: 'questions', message: 'At least one question is required' });
    }

    // Kui on vigu, siis tagastame need vastuses
    if (errors.length > 0) {
        return res.status(400).json({
            code: 400,
            message: 'Validation failed',
            details: errors
        });
    }

    // Kui kõik on korras, läheme järgmisse middleware'i
    next();
};

// FormsController klass, mis sisaldab kõiki formaadiga seotud tegevusi
export class FormsController {
    // Loo uus vorm
    static async createForm(req, res) {
        try {
            const form = await FormModel.create(req.body); // Salvestame vormi andmed
            res.status(201).json(form); // Tagastame loodud vormi
        } catch (error) {
            res.status(500).json({ code: 500, message: 'Internal server error', details: [{ message: error.message }] });
        }
    }

    // Get kõik vormid, arvestades lehtede arvu ja piiranguid
    static async getForms(req, res) {
        try {
            const page = parseInt(req.query.page) || 1; // Leht, millele pöörduda
            const limit = parseInt(req.query.limit) || 10; // Lehe suurus
            const forms = await FormModel.findAll(page, limit); // Võtame vormid
            res.json(forms); // Tagastame kõik vormid
        } catch (error) {
            res.status(500).json({ code: 500, message: 'Internal server error', details: [{ message: error.message }] });
        }
    }

    // Get vorm vastavalt ID-le
    static async getFormById(req, res) {
        try {
            const form = await FormModel.findById(req.params.id); // Otsime vormi ID järgi
            if (!form) {
                return res.status(404).json({ code: 404, message: 'Form not found', details: [{ message: `Form with ID ${req.params.id} does not exist` }] });
            }
            res.json(form); // Tagastame leitud vormi
        } catch (error) {
            res.status(500).json({ code: 500, message: 'Internal server error', details: [{ message: error.message }] });
        }
    }

    // Uuenda vormi vastavalt ID-le
    static async updateForm(req, res) {
        try {
            const form = await FormModel.update(req.params.id, req.body); // Uuendame vormi
            if (!form) {
                return res.status(404).json({ code: 404, message: 'Form not found', details: [{ message: `Form with ID ${req.params.id} does not exist` }] });
            }
            res.json(form); // Tagastame uuendatud vormi
        } catch (error) {
            res.status(500).json({ code: 500, message: 'Internal server error', details: [{ message: error.message }] });
        }
    }

    // Kustuta vorm vastavalt ID-le
    static async deleteForm(req, res) {
        try {
            const deleted = await FormModel.delete(req.params.id); // Kustutame vormi
            if (!deleted) {
                return res.status(404).json({ code: 404, message: 'Form not found', details: [{ message: `Form with ID ${req.params.id} does not exist` }] });
            }
            res.status(204).send(); // Tagastame tühja vastuse, kuna vorm on kustutatud
        } catch (error) {
            res.status(500).json({ code: 500, message: 'Internal server error', details: [{ message: error.message }] });
        }
    }
}

// API endpointid, mis kasutavad FormsController klassi meetodeid
router.post('/', authenticateToken, validateForm, FormsController.createForm);  // Loo vorm
router.get('/', authenticateToken, FormsController.getForms);  // Kõik vormid
router.get('/:id', authenticateToken, FormsController.getFormById);  // Vorm ID järgi
router.put('/:id', authenticateToken, validateForm, FormsController.updateForm);  // Uuenda vormi
router.delete('/:id', authenticateToken, FormsController.deleteForm);  // Kustuta vorm

// Ekspordi router
export { router as formsRouter };
