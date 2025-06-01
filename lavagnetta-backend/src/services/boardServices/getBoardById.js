// backend/services/boardServices/getBoardById.js

const boardModel = require('../../models/boardModel');

/**
 * Servizio per recuperare una lavagnetta per ID.
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @returns {Object|null} - Lavagnetta trovata o null.
 */
const getBoardById = async (userId, boardId) => {
    try {
        const board = await boardModel.getBoardById(userId, boardId);
        return board;
    } catch (error) {
        throw new Error('Errore nel recuperare la lavagnetta.');
    }
};

module.exports = getBoardById;
