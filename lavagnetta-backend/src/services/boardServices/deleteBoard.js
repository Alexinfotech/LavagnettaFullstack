// backend/services/boardServices/deleteBoard.js

const boardModel = require('../../models/boardModel');

/**
 * Servizio per eliminare una lavagnetta.
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @returns {boolean} - True se eliminata, false altrimenti.
 */
const deleteBoardService = async (userId, boardId) => {
    try {
        const result = await boardModel.deleteBoard(userId, boardId);
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
};

module.exports = deleteBoardService;
