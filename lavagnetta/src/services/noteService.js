// src/services/noteService.js

import api from './api';

/**
 * Recupera tutte le note dell'utente.
 * @returns {Promise<Array>} - Array di note.
 */
export const getNotes = async () => {
    try {
        const response = await api.get('/auth/notes');
        return response.data;
    } catch (error) {
        console.error('Errore nel recuperare le note:', error);
        throw error;
    }
};
