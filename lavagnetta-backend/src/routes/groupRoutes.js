// backend/routes/groupRoutes.js
const express = require('express');
// ---- MODIFICA INIZIO: Aggiunto 'query' da express-validator ----
// (Modifica già presente nel codice fornito, mantenuta)
const { body, param, query } = require('express-validator');
// ---- MODIFICA FINE ----
const router = express.Router();

const groupController = require('../controllers/groupController');
// Assicurati che groupProductController sia importato correttamente:
const groupProductController = require('../controllers/groupProductController'); // <-- VERIFICATO
const authenticate = require('../middleware/authMiddleware');
const { groupAuthMiddleware } = require('../middleware/groupAuth.middleware');
const { groupAdminMiddleware } = require('../middleware/groupAdmin.middleware');

// Middleware Globale per Autenticazione (Applica a tutte le rotte di questo file)
router.use(authenticate);

// --- Rotte Generali Gruppi ---
router.get('/', groupController.getUserGroups);
router.post('/', [
    body('name', 'Il nome del gruppo è richiesto').trim().notEmpty().isLength({ min: 1, max: 100 }),
    // Aggiungere validazione più robusta per 'members' se usata alla creazione
    body('members').optional().isArray().withMessage("Il campo 'members' deve essere un array se fornito."),
    body('members.*.email').optional().isEmail().withMessage("Fornire email valide nell'array 'members'."),
    body('members.*.role').optional().isIn(['level1', 'level2']).withMessage("Ruolo non valido per i membri iniziali (solo level1 o level2)."),
], groupController.createGroup);
router.post('/invites/handle', [ // Validazione più specifica
    body('notificationId', 'ID notifica richiesto').isInt({ gt: 0 }),
    body('accept', 'Il campo accept (true/false) è richiesto').isBoolean()
], groupController.handleInvite);

// --- Middleware per Rotte Specifiche Gruppo (:groupId) ---
// Applica controllo ID gruppo e verifica appartenenza utente al gruppo
router.use('/:groupId', [
    param('groupId').isInt({ gt: 0 }).withMessage('ID Gruppo non valido nel percorso.')
], groupAuthMiddleware); // Questo middleware imposta anche req.userRole e valida l'appartenenza

// --- Rotte Specifiche Gruppo (Accesso Membri) ---
router.get('/:groupId', groupController.getGroupById);
router.get('/:groupId/members', groupController.getGroupMembers);
router.get('/:groupId/boards', groupController.getGroupBoards);
router.get('/:groupId/boards/:boardId', [
    param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido nel percorso.')
], groupController.getGroupBoardById);

// ---- ROTTA STATUS (Esistente nel codice fornito, mantenuta) ----
/**
 * @route   GET /api/auth/groups/:groupId/boards/:boardId/status
 * @desc    Controlla se ci sono aggiornamenti per la lavagna o il gruppo dopo un certo timestamp.
 * @access  Private (Membro del gruppo - verificato da groupAuthMiddleware a monte)
 * @query   since - Timestamp in millisecondi (obbligatorio, intero > 0)
 */
router.get(
    '/:groupId/boards/:boardId/status', // :groupId è già validato dal middleware sopra
    [ // Validatori aggiuntivi per boardId e query 'since'
        param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido nel percorso.'),
        // Validatore per il query parameter 'since'
        query('since')
            .exists({ checkFalsy: true }).withMessage("Il parametro 'since' è richiesto nella query string.") // checkFalsy considera '' e 0 come non esistenti
            .isInt({ gt: 0 }).withMessage("Il timestamp 'since' deve essere un numero intero positivo (millisecondi).")
            .toInt() // Converte in numero intero per il controller
    ],
    // groupAuthMiddleware è già stato eseguito, req.userRole è disponibile
    groupController.getGroupBoardStatus // Chiama il nuovo metodo del controller
);
// ---- FINE ROTTA STATUS ----


// --- ROTTA: Abbandona Gruppo (Esistente nel codice fornito, mantenuta) ---
// Accessibile da qualsiasi membro verificato da groupAuthMiddleware
router.delete('/:groupId/members/me', groupController.leaveGroup);


// --- Rotte Amministrazione Gruppo (:groupId + Admin) ---

// Invita Membri (Richiede Admin)
router.post('/:groupId/invite', [
    groupAdminMiddleware, // Verifica ruolo admin
    body('members', 'Il campo members deve essere un array non vuoto').isArray({ min: 1 }),
    body('members.*.email', 'Formato email non valido').isEmail(),
    body('members.*.role', 'Ruolo non valido').optional().isIn(['level1', 'level2']) // Solo questi ruoli per invito
], groupController.inviteMembers);

// Aggiorna Ruolo Membro (Richiede Admin)
router.put('/:groupId/members/:userId', [
    groupAdminMiddleware,
    param('userId').isInt({ gt: 0 }).withMessage('ID Utente non valido.'),
    body('role').isIn(['admin', 'level1', 'level2']).withMessage('Ruolo specificato non valido.')
], groupController.updateMemberRole);

// Richiesta Declassamento Admin (Richiede Admin)
router.post('/:groupId/members/:userId/request-role-change', [
    groupAdminMiddleware,
    param('userId').isInt({ gt: 0 }).withMessage('ID Utente target non valido.'),
    body('role').isIn(['level1', 'level2']).withMessage('Ruolo proposto non valido (solo level1 o level2).')
], groupController.requestMemberRoleChange);

// Rimuovi Membro (da parte di un admin) (Richiede Admin)
router.delete('/:groupId/members/:userId', [
    groupAdminMiddleware,
    param('userId').isInt({ gt: 0 }).withMessage('ID Utente da rimuovere non valido.')
], groupController.removeMember);

// Trasferisci Ruolo Admin (Richiede Admin)
router.post('/:groupId/transfer-admin', [
    groupAdminMiddleware,
    body('newAdminId').notEmpty().withMessage('ID nuovo admin richiesto.').isInt({ gt: 0 }).withMessage('ID nuovo admin non valido.')
], groupController.transferAdminRole);

// --- Rotte Lavagne Gruppo ---
// Creazione (Richiede Admin o Level1)
router.post('/:groupId/boards', [
    // Middleware inline per controllo ruolo specifico per creazione
    (req, res, next) => {
        if (!req.userRole || !['admin', 'level1'].includes(req.userRole)) {
            return res.status(403).json({ message: 'Permesso negato: solo Admin o Editor possono creare lavagne.' });
        }
        next();
    },
    body('name', 'Il nome della lavagna è richiesto').trim().notEmpty().isLength({ max: 100 }),
    body('background').optional().isString().isLength({ max: 255 })
], groupController.createGroupBoard);

// Aggiornamento (Permessi gestiti nel service in base al ruolo e se è default)
router.put('/:groupId/boards/:boardId', [
    param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido.'),
    // Il controllo permessi è fatto nel service ora
    body().custom((value, { req }) => { // Valida che almeno un campo sia presente
        if (req.body.name === undefined && req.body.background === undefined) {
            throw new Error('Devi fornire almeno un campo (name o background) da aggiornare.');
        }
        return true;
    }),
    body('name').optional().trim().notEmpty().withMessage('Il nome non può essere vuoto se fornito.').isLength({ max: 100 }),
    body('background').optional().isString().withMessage('Lo sfondo deve essere una stringa.').isLength({ max: 255 })
], groupController.updateGroupBoard);

// Eliminazione (Richiede Admin)
router.delete('/:groupId/boards/:boardId', [
    groupAdminMiddleware, // Solo Admin elimina lavagne gruppo
    param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido.')
], groupController.deleteBoard);

// --- Elimina Gruppo (Richiede Admin) ---
router.delete('/:groupId', [
    groupAdminMiddleware // Solo Admin elimina gruppo (controllo ultimo membro nel service)
], groupController.deleteGroup);


// --- Rotte Prodotti Gruppo ---
// groupAuthMiddleware (a monte) garantisce appartenenza al gruppo.
// I permessi specifici per azione (es. level2 non modifica default board) sono nel groupProductService.
router.get('/:groupId/boards/:boardId/products', [
    param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido.')
], groupProductController.getGroupProducts);

router.post('/:groupId/boards/:boardId/products', [
    param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido.'),
    body('name', 'Il nome del prodotto è richiesto').trim().notEmpty().isLength({ max: 255 }),
    body('is_purchased').optional().isBoolean().withMessage('Lo stato acquistato deve essere booleano.')
], groupProductController.createGroupProduct);

router.put('/:groupId/boards/:boardId/products/:productId', [
    param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido.'),
    param('productId').isInt({ gt: 0 }).withMessage('ID Prodotto non valido.'),
    body().custom((value, { req }) => { // Valida che almeno un campo sia presente
        if (req.body.name === undefined && req.body.is_purchased === undefined) {
            throw new Error('Devi fornire almeno un campo (name o is_purchased) da aggiornare.');
        }
        return true;
    }),
    body('name').optional().trim().notEmpty().withMessage('Il nome non può essere vuoto se fornito.').isLength({ max: 255 }),
    body('is_purchased').optional().isBoolean().withMessage('Lo stato acquistato deve essere booleano.')
], groupProductController.updateGroupProduct);

router.delete('/:groupId/boards/:boardId/products/:productId', [
    param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido.'),
    param('productId').isInt({ gt: 0 }).withMessage('ID Prodotto non valido.')
], groupProductController.deleteGroupProduct);


// --- NUOVA ROTTA PER AGGIUNTA BATCH ---  <-- AGGIUNTA QUI
/**
 * @route   POST /api/auth/groups/:groupId/boards/:boardId/products/batch
 * @desc    Aggiunge più prodotti a una lavagna di gruppo da un array di nomi.
 * @access  Private (Permesso verificato nel service)
 * @body    { names: ["nome prodotto 1", "nome prodotto 2", ...] }
 */
router.post(
    '/:groupId/boards/:boardId/products/batch', // Assicurati che il percorso sia relativo a /api/auth/groups
    [ // Validatori specifici per la rotta batch
        param('groupId').isInt({ gt: 0 }).withMessage('ID Gruppo non valido.'), // Già validato da middleware a monte, ma è una buona pratica
        param('boardId').isInt({ gt: 0 }).withMessage('ID Lavagna non valido.'),
        body('names')
            .isArray({ min: 1 }).withMessage('Il campo "names" deve essere un array non vuoto.')
            .custom((names) => names.every(name => typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 255))
            .withMessage('L\'array "names" deve contenere solo stringhe valide (1-255 caratteri).')
    ],
    // Chiama il nuovo metodo che aggiungeremo al controller
    groupProductController.createMultipleGroupProducts
);
// --- FINE NUOVA ROTTA ---


module.exports = router;