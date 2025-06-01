import api from './api';


/**
 * Ottiene tutte le lavagnette dell'utente.
 * @returns {Promise<Array>} - Array di lavagnette.
 */
const getBoards = async () => {
    try {
        const response = await api.get('/boards');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Crea una nuova lavagnetta.
 * @param {string} name - Nome della lavagnetta.
 * @param {string} background - Sfondo della lavagnetta.
 * @returns {Promise<Object>} - Lavagnetta creata.
 */
const createBoard = async (name, background) => {
    try {
        const response = await api.post('/boards', { name, background });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Aggiorna una lavagnetta.
 * @param {number} id - ID della lavagnetta.
 * @param {string} name - Nuovo nome.
 * @param {string} background - Nuovo sfondo.
 * @returns {Promise<Object>} - Lavagnetta aggiornata.
 */
const updateBoard = async (id, name, background) => {
    try {
        const response = await api.put(`/boards/${id}`, { name, background });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Elimina una lavagnetta.
 * @param {number} id - ID della lavagnetta.
 * @returns {Promise<Object>} - Messaggio di conferma.
 */
const deleteBoard = async (id) => {
    try {
        const response = await api.delete(`/boards/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Aggiorna il nome di una lavagnetta.
 * @param {number} id - ID della lavagnetta.
 * @param {string} name - Nuovo nome.
 * @returns {Promise<Object>} - Lavagnetta aggiornata.
 */
const updateBoardName = async (id, name) => {
    try {
        const response = await api.put(`/boards/${id}`, { name });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Aggiorna lo sfondo di una lavagnetta.
 * @param {number} id - ID della lavagnetta.
 * @param {string} background - Nuovo sfondo.
 * @returns {Promise<Object>} - Lavagnetta aggiornata.
 */
const updateBoardBackground = async (id, background) => {
    try {
        const response = await api.put(`/boards/${id}`, { background });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const boardService = {
    getBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    updateBoardName,
    updateBoardBackground
};

export default boardService;
