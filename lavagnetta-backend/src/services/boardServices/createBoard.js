// backend/services/boardServices/createBoard.js

const boardModel = require('../../models/boardModel');

/**
 * Servizio per creare una nuova lavagnetta.
 * @param {number} userId - ID dell'utente.
 * @param {string} name - Nome della lavagnetta.
 * @param {string} background - Sfondo della lavagnetta.
 * @returns {Object} - Lavagnetta creata.
 */
const createBoard = async (userId, name, background) => {
    try {
        // Se l'utente non ha lavagnette, crea una lavagnetta di default
        const boards = await boardModel.getBoardsByUserId(userId);
        let isDefault = false;
        if (boards.length === 0) {
            isDefault = true;
        }

        const newBoard = await boardModel.createBoard(userId, name, background, isDefault);
        return newBoard;
    } catch (error) {
        throw new Error('Errore nella creazione della lavagnetta.');
    }
};

module.exports = createBoard;
