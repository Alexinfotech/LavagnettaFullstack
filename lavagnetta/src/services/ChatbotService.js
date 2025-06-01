// src/services/ChatbotService.js
import api from './api'; // Importa l'istanza axios configurata (che usa /api come baseURL)

const ChatbotService = {
  /**
   * Invia un messaggio al backend Node.js del chatbot.
   * @param {string} message - Il messaggio dell'utente.
   * @returns {Promise<object>} - La risposta dal backend (es. { assistant_response: "..." }).
   */
  interact: (message) => {
    // Non serve più passare userId, viene estratto dal token nel backend Node.js
    // Il token viene già aggiunto automaticamente dall'interceptor in api.js
    console.log("[ChatbotService Frontend] Sending message to Node.js endpoint '/api/chatbot/send-message':", message); // Log più specifico
    // --- URL CORRETTO RELATIVO ALLA baseURL '/api' ---
    return api.post('/chatbot/send-message', { message })
      .then((response) => {
        console.log("[ChatbotService Frontend] Received response:", response.data);
        return response.data; // Restituisce i dati (es. { assistant_response: "..." })
      })
      .catch((error) => {
        // Logga l'errore specifico ricevuto da axios
        console.error("[ChatbotService Frontend] Error calling backend:", error.response?.data || error.message);
        // Rilancia l'errore per gestirlo nel componente React
        throw error;
      });
  },
};

export default ChatbotService;