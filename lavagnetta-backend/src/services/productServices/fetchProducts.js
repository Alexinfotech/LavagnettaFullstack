// backend/services/productServices/fetchProducts.js

const productModel = require('../../models/productModel');

/**
 * Servizio per recuperare tutti i prodotti di una lavagnetta.
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @returns {Array} - Array di prodotti.
 */
const fetchProducts = async (userId, boardId) => {
    try {
        const products = await productModel.getProductsByBoardId(userId, boardId);
        return products;
    } catch (error) {
        throw new Error('Errore nel recuperare i prodotti.');
    }
};

module.exports = fetchProducts;
