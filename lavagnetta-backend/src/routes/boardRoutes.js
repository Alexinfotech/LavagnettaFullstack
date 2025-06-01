// backend/routes/boardRoutes.js

const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
// Non importiamo più productController qui, ma lo usiamo direttamente da boardController se necessario
const authMiddleware = require('../middleware/authMiddleware');
// Importiamo un eventuale middleware per validare gli ID numerici (opzionale ma buona pratica)
// const validateId = require('../middleware/validateIdMiddleware'); // Esempio, da creare se necessario

// Applica il middleware di autenticazione a tutte le rotte in questo file
router.use(authMiddleware);

// --- Rotte per Lavagne PERSONALI ---

/**
 * @route   GET /api/auth/boards/personal
 * @desc    Ottiene tutte le lavagne PERSONALI dell'utente autenticato
 * @access  Private
 */
router.get('/personal', boardController.getPersonalBoards);

/**
 * @route   POST /api/auth/boards
 * @desc    Crea una nuova lavagna PERSONALE per l'utente autenticato
 * @access  Private
 */
router.post('/', boardController.createPersonalBoard);

/**
 * @route   GET /api/auth/boards/:id
 * @desc    Ottiene i dettagli di una specifica lavagna PERSONALE (se l'utente è il creatore)
 * @access  Private
 * @note    L'accesso a lavagne di gruppo avverrà tramite /api/auth/groups/:groupId/boards/:boardId
 */
// router.get('/:id', validateId, boardController.getBoardById); // Aggiungere validazione ID se implementata
router.get('/:id', boardController.getBoardById); // GET /api/auth/boards/:id

/**
 * @route   PUT /api/auth/boards/:id
 * @desc    Aggiorna una lavagna PERSONALE esistente (nome, sfondo, is_default)
 * @access  Private
 */
// router.put('/:id', validateId, boardController.updatePersonalBoard);
router.put('/:id', boardController.updatePersonalBoard); // PUT /api/auth/boards/:id

/**
 * @route   DELETE /api/auth/boards/:id
 * @desc    Elimina una lavagna PERSONALE esistente (se non è la default)
 * @access  Private
 */
// router.delete('/:id', validateId, boardController.deletePersonalBoard);
router.delete('/:id', boardController.deletePersonalBoard); // DELETE /api/auth/boards/:id


// --- Rotte per i Prodotti all'interno di una Lavagna ---
// ATTENZIONE: Queste rotte operano su /:id. Al momento NON distinguono se :id
// è una lavagna personale o di gruppo. Sarà NECESSARIO aggiungere controlli
// di accesso più granulari qui o nei controller/servizi dei prodotti per
// verificare se l'utente ha i permessi sulla lavagna specifica (personale o di gruppo).
// Per ora, assumono che se l'utente è autenticato, possa interagire (errato per i gruppi).

/**
 * @route   GET /api/auth/boards/:id/products
 * @desc    Ottiene tutti i prodotti di una lavagna specifica
 * @access  Private (Controllo accesso granulare alla lavagna :id necessario!)
 */
// router.get('/:id/products', validateId, boardController.getProducts);
router.get('/:id/products', boardController.getProducts);

/**
 * @route   POST /api/auth/boards/:id/products
 * @desc    Aggiunge un prodotto a una lavagna specifica
 * @access  Private (Controllo accesso granulare alla lavagna :id necessario!)
 */
// router.post('/:id/products', validateId, boardController.createProduct);
router.post('/:id/products', boardController.createProduct);

/**
 * @route   PUT /api/auth/boards/:id/products/:productId
 * @desc    Aggiorna un prodotto specifico in una lavagna
 * @access  Private (Controllo accesso granulare alla lavagna :id necessario!)
 */
// router.put('/:id/products/:productId', validateId, boardController.updateProduct); // Validare anche productId
router.put('/:id/products/:productId', boardController.updateProduct);

/**
 * @route   DELETE /api/auth/boards/:id/products/:productId
 * @desc    Elimina un prodotto specifico da una lavagna
 * @access  Private (Controllo accesso granulare alla lavagna :id necessario!)
 */
// router.delete('/:id/products/:productId', validateId, boardController.deleteProduct); // Validare anche productId
router.delete('/:id/products/:productId', boardController.deleteProduct);


module.exports = router;