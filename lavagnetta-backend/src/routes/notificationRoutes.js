// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/authMiddleware'); // Percorso corretto

// Applica il middleware di autenticazione a tutte le rotte
router.use(authenticate);

// Rotta per recuperare tutte le notifiche dell'utente
router.get('/', notificationController.getNotifications);

// Rotta per accettare una notifica
router.post('/:id/accept', notificationController.acceptNotification);

// Rotta per rifiutare una notifica
router.post('/:id/reject', notificationController.rejectNotification);

module.exports = router;
