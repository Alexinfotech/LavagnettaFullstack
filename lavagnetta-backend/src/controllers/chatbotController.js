// src/controllers/chatbotController.js
const { validationResult } = require('express-validator');
const chatbotService = require('../services/chatbotService');

class ChatbotController {
    async sendMessage(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const userId = req.user?.id;
        const userMessage = req.body.message;
        if (!userId) return res.status(401).json({ error: 'Autenticazione richiesta.' });

        try {
            console.log(`[ChatbotController] Ricevuta richiesta da User ${userId}`);
            // chatbotService.getResponse ora restituisce l'oggetto JSON
            const assistantJsonResponse = await chatbotService.getResponse(userId, userMessage);
            console.log(`[ChatbotController] Invio risposta JSON a User ${userId}`);
            res.json(assistantJsonResponse); // <-- Invia direttamente l'oggetto JSON
        } catch (error) {
            console.error(`[ChatbotController] Errore per User ${userId}:`, error);
            // Invia un oggetto JSON anche in caso di errore per coerenza
            res.status(500).json({
                response_text: "Si è verificato un errore interno. Riprova più tardi.",
                is_recipe: false,
                is_off_topic: true,
                ingredients: null,
                recipe_name: null,
                instructions: null
            });
        }
    }
}

module.exports = new ChatbotController();