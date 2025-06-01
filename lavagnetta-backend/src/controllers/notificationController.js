// backend/controllers/notificationController.js
const notificationService = require("../services/notificationService");

const notificationController = {
    // Recupera tutte le notifiche dell'utente
    async getNotifications(req, res) {
        console.log("Chiamata a getNotifications");
        try {
            const userId = req.user.id;
            const notifications = await notificationService.getUserNotifications(userId);
            res.status(200).json(notifications);
        } catch (error) {
            console.error("Errore nel recupero delle notifiche:", error);
            res.status(500).json({ message: "Errore nel recupero delle notifiche" });
        }
    },

    // Accetta un invito tramite notifica
    async acceptNotification(req, res) {
        console.log("Chiamata a acceptNotification");
        try {
            const notificationId = req.params.id; // Utilizza 'id' invece di 'notificationId'
            const userId = req.user.id;
            await notificationService.acceptNotification(notificationId, userId);
            res.status(200).json({ message: "Invito accettato con successo." });
        } catch (error) {
            console.error("Errore nell'accettare la notifica:", error);
            res.status(500).json({ error: "Errore interno del server." });
        }
    },

    // Rifiuta un invito tramite notifica
    async rejectNotification(req, res) {
        console.log("Chiamata a rejectNotification");
        try {
            const notificationId = req.params.id; // Utilizza 'id' invece di 'notificationId'
            const userId = req.user.id;
            await notificationService.rejectNotification(notificationId, userId);
            res.status(200).json({ message: "Invito rifiutato con successo." });
        } catch (error) {
            console.error("Errore nel rifiutare la notifica:", error);
            res.status(500).json({ error: "Errore interno del server." });
        }
    },
};

module.exports = notificationController;
