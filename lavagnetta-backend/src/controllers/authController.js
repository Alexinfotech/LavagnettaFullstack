// backend/controllers/authController.js

const { registerUser, loginUser, renewToken } = require('../services/authService');
const { validationResult } = require('express-validator');

/**
 * Controller per la registrazione di un utente.
 */
const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, username } = req.body;

    try {
        const result = await registerUser(email, password, username);
        if (result.success) {
            res.json({ success: true, token: result.token, message: result.message });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Errore nel controller di registrazione:', error);
        res.status(500).json({ success: false, message: 'Errore server durante la registrazione.' });
    }
};

/**
 * Controller per il login di un utente.
 */
const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const result = await loginUser(email, password);
        if (result.success) {
            res.json({ success: true, token: result.token, message: result.message });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Errore nel controller di login:', error);
        res.status(500).json({ success: false, message: 'Errore server durante il login.' });
    }
};

/**
 * Controller per rinnovare un token JWT.
 */
const renewTokenController = async (req, res) => {
    try {
        const userId = req.user.id;
        const newToken = renewToken(userId);
        res.json({ success: true, token: newToken });
    } catch (error) {
        console.error('Errore nel controller di rinnovo token:', error);
        res.status(500).json({ success: false, message: 'Errore server durante il rinnovo del token.' });
    }
};

module.exports = {
    register,
    login,
    renewToken: renewTokenController // Aggiunto
};
