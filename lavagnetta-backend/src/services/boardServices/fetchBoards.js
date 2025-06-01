// backend/services/boardServices/fetchBoards.js

const boardModel = require('../../models/boardModel');

/**
 * Servizio per recuperare tutte le lavagnette di un utente.
 * @param {number} userId - ID dell'utente.
 * @returns {Array} - Array di lavagnette.
 */
const fetchBoards = async (userId) => {
    try {
        const boards = await boardModel.getBoardsByUserId(userId);
        return boards;
    } catch (error) {
        throw new Error('Errore nel recuperare le lavagnette.');
    }
};

module.exports = fetchBoards;
