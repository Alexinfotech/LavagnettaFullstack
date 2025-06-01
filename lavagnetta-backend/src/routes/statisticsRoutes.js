// src/routes/statisticsRoutes.js

const express = require('express');
const { query, param } = require('express-validator'); // Importa query e param
const statisticsController = require('../controllers/statisticsController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware autenticazione

const router = express.Router();

// Applica autenticazione a tutte le rotte statistiche
router.use(authMiddleware);

/**
 * @route   GET /api/stats/summary
 * @desc    Ottiene le metriche di riepilogo (totali, medie) per un periodo.
 * @access  Private
 * @query   startDate (YYYY-MM-DD, opzionale)
 * @query   endDate (YYYY-MM-DD, opzionale)
 * @query   location (string, opzionale, nome negozio specifico)
 */
router.get(
    '/summary',
    [
        // Validatori opzionali per le date
        query('startDate').optional().isISO8601().toDate().withMessage('Formato startDate non valido (YYYY-MM-DD).'),
        query('endDate').optional().isISO8601().toDate().withMessage('Formato endDate non valido (YYYY-MM-DD).'),
        // Validatore opzionale per location (stringa semplice)
        query('location').optional().isString().trim().escape()
    ],
    statisticsController.getSummaryStats // Chiama il controller
);

/**
 * @route   GET /api/stats/timeseries
 * @desc    Ottiene i dati aggregati per un grafico temporale (spesa per mese/giorno).
 * @access  Private
 * @query   startDate (YYYY-MM-DD, opzionale)
 * @query   endDate (YYYY-MM-DD, opzionale)
 * @query   location (string, opzionale)
 * @query   groupBy (string, opzionale, default 'month', valori possibili 'month', 'day')
 */
router.get(
    '/timeseries',
    [
        query('startDate').optional().isISO8601().toDate().withMessage('Formato startDate non valido (YYYY-MM-DD).'),
        query('endDate').optional().isISO8601().toDate().withMessage('Formato endDate non valido (YYYY-MM-DD).'),
        query('location').optional().isString().trim().escape(),
        query('groupBy').optional().isIn(['month', 'day']).withMessage("groupBy deve essere 'month' o 'day'.").default('month') // Default a 'month'
    ],
    statisticsController.getTimeSeriesStats // Chiama il controller
);

/**
 * @route   GET /api/stats/bylocation
 * @desc    Ottiene i dati aggregati per luogo/negozio.
 * @access  Private
 * @query   startDate (YYYY-MM-DD, opzionale)
 * @query   endDate (YYYY-MM-DD, opzionale)
 */
router.get(
    '/bylocation',
    [
        query('startDate').optional().isISO8601().toDate().withMessage('Formato startDate non valido (YYYY-MM-DD).'),
        query('endDate').optional().isISO8601().toDate().withMessage('Formato endDate non valido (YYYY-MM-DD).')
    ],
    statisticsController.getStatsByLocation // Chiama il controller
);


// Aggiungeremo qui le rotte per l'export CSV/PDF più avanti

module.exports = router;