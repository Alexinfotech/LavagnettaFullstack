// backend/services/productServices/getProductById.js

const productModel = require('../../models/productModel');

/**
 * Servizio per recuperare un prodotto per ID.
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @param {number} productId - ID del prodotto.
 * @returns {Object|null} - Prodotto trovato o null.
 */
const getProductById = async (userId, boardId, productId) => {
    try {
        const products = await productModel.getProductsByBoardId(userId, boardId);
        const product = products.find(p => p.id === productId);
        return product || null;
    } catch (error) {
        throw new Error('Errore nel recuperare il prodotto.');
    }
};

module.exports = getProductById;
