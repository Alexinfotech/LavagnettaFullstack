// frontend/src/services/notificationService.js
import api from './api';

const notificationService = {
    // Recupera tutte le notifiche dell'utente
    getNotifications: async () => {
        try {
            const response = await api.get("/auth/notifications");
            return response.data;
        } catch (error) {
            console.error("Errore nel recupero delle notifiche:", error);
            throw error;
        }
    },

    // Accetta un invito tramite notifiche
    acceptInvite: async (notificationId) => {
        try {
            const response = await api.post(
                `/auth/notifications/${notificationId}/accept`
            );
            return response.data;
        } catch (error) {
            console.error("Errore nell'accettare l'invito:", error);
            throw error;
        }
    },

    // Rifiuta un invito tramite notifiche
    rejectInvite: async (notificationId) => {
        try {
            const response = await api.post(
                `/auth/notifications/${notificationId}/reject`
            );
            return response.data;
        } catch (error) {
            console.error("Errore nel rifiutare l'invito:", error);
            throw error;
        }
    },
};

export default notificationService;
