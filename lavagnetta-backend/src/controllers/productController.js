// backend/controllers/productController.js

const fetchProductsService = require('../services/productServices/fetchProducts');
const createProductService = require('../services/productServices/createProduct');
const updateProductService = require('../services/productServices/updateProduct');
const deleteProductService = require('../services/productServices/deleteProduct');

/**
 * Ottiene tutti i prodotti di una lavagnetta.
 */
exports.getProducts = async (req, res) => {
    const userId = req.user.id;
    const boardId = req.params.id;

    try {
        // Il service fetchProducts prende i dati dal model (che non include lastModifiedByUsername per board personali)
        const products = await fetchProductsService(userId, boardId);
        res.status(200).json(products);
    } catch (error) {
        console.error('Errore nel recuperare i prodotti:', error);
        // Restituisce un errore generico ma logga quello specifico
        res.status(500).json({ error: 'Errore nel recuperare i prodotti.' });
    }
};

/**
 * Crea un nuovo prodotto in una lavagnetta.
 */
exports.createProduct = async (req, res) => {
    const userId = req.user.id;
    const boardId = req.params.id;
    const { name, is_purchased } = req.body;

    if (!name || !name.trim()) { // Aggiunto trim() check
        return res.status(400).json({ error: 'Il nome del prodotto è richiesto.' });
    }

    try {
        // Il service createProduct ora restituisce l'oggetto prodotto con actionCompletionTimestamp
        const product = await createProductService(userId, boardId, name.trim(), is_purchased);
        // Restituisce l'intero oggetto prodotto al frontend
        res.status(201).json(product);
    } catch (error) {
        console.error('Errore nell\'aggiunta del prodotto:', error);
        res.status(500).json({ error: error.message || 'Errore durante la creazione del prodotto.' });
    }
};

/**
 * Aggiorna un prodotto esistente.
 */
exports.updateProduct = async (req, res) => {
    const userId = req.user.id;
    const boardId = req.params.id;
    const productId = req.params.productId;
    const { name, is_purchased } = req.body;

    // Verifica che almeno uno dei campi da aggiornare sia presente
    if (name === undefined && is_purchased === undefined) {
        return res.status(400).json({ error: 'Almeno un campo (nome o stato di acquisto) deve essere fornito per l\'aggiornamento.' });
    }
    // Se il nome è fornito, assicurati che non sia vuoto dopo il trim
    if (name !== undefined && !name.trim()) {
        return res.status(400).json({ error: 'Il nome del prodotto non può essere vuoto se fornito.' });
    }


    try {
        // Il service updateProduct ora restituisce l'oggetto prodotto aggiornato con actionCompletionTimestamp
        const updatedProduct = await updateProductService(userId, boardId, productId, name !== undefined ? name.trim() : undefined, is_purchased);
        // Restituisce l'intero oggetto prodotto aggiornato al frontend
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Errore nell\'aggiornamento del prodotto:', error);
        // Gestione più specifica per errore "non trovato"
        if (error.message && error.message.toLowerCase().includes('non trovato')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Errore durante l\'aggiornamento del prodotto.' });
    }
};

/**
 * Elimina un prodotto.
 * **MODIFICATO: Include actionCompletionTimestamp nella risposta JSON.**
 */
exports.deleteProduct = async (req, res) => {
    const userId = req.user.id;
    const boardId = req.params.id;
    const productId = req.params.productId;

    try {
        // ***** MODIFICA QUI: Cattura il risultato dal service *****
        // Il service deleteProduct ora restituisce { success: true, actionCompletionTimestamp: ... }
        const result = await deleteProductService(userId, boardId, productId);
        // ***** FINE MODIFICA *****

        // ***** MODIFICA QUI: Includi il timestamp nella risposta JSON *****
        res.status(200).json({
            message: 'Prodotto eliminato con successo.',
            actionCompletionTimestamp: result.actionCompletionTimestamp // Aggiunto timestamp
        });
        // ***** FINE MODIFICA *****

    } catch (error) {
        console.error('Errore nella cancellazione del prodotto:', error);
        // Gestione più specifica per errore "non trovato"
        if (error.message && error.message.toLowerCase().includes('non trovato')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Errore durante l\'eliminazione del prodotto.' });
    }
};