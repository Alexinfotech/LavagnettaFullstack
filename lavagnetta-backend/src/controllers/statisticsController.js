// src/controllers/statisticsController.js

const { validationResult } = require('express-validator');
const statisticsService = require('../services/statisticsService'); // Assicurati che il percorso sia corretto

exports.getSummaryStats = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user.id; // Dall'authMiddleware
        const { startDate, endDate, location } = req.query; // Estrai query params validati

        console.log(`[statsCtrl] Richiesta Summary - User: ${userId}, Start: ${startDate}, End: ${endDate}, Location: ${location}`);

        // Chiamata al service (da implementare)
        const summary = await statisticsService.calculateSummaryStats(userId, startDate, endDate, location);

        res.status(200).json(summary);

    } catch (error) {
        console.error('[statsCtrl] Errore getSummaryStats:', error);
        res.status(500).json({ message: 'Errore del server nel calcolare le statistiche di riepilogo.' });
    }
};

exports.getTimeSeriesStats = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user.id;
        const { startDate, endDate, location, groupBy } = req.query; // Estrai query params validati

        console.log(`[statsCtrl] Richiesta TimeSeries - User: ${userId}, Start: ${startDate}, End: ${endDate}, Location: ${location}, GroupBy: ${groupBy}`);

        // Chiamata al service (da implementare)
        const timeSeriesData = await statisticsService.calculateTimeSeriesStats(userId, startDate, endDate, location, groupBy);

        res.status(200).json(timeSeriesData);

    } catch (error) {
        console.error('[statsCtrl] Errore getTimeSeriesStats:', error);
        res.status(500).json({ message: 'Errore del server nel calcolare le statistiche temporali.' });
    }
};

exports.getStatsByLocation = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        console.log(`[statsCtrl] Richiesta ByLocation - User: ${userId}, Start: ${startDate}, End: ${endDate}`);

        // Chiamata al service (da implementare)
        const locationData = await statisticsService.calculateStatsByLocation(userId, startDate, endDate);

        res.status(200).json(locationData);

    } catch (error) {
        console.error('[statsCtrl] Errore getStatsByLocation:', error);
        res.status(500).json({ message: 'Errore del server nel calcolare le statistiche per luogo.' });
    }
};

// Aggiungeremo qui le funzioni per l'export più avanti
// exports.exportCsv = async (req, res) => { ... };
// exports.exportPdf = async (req, res) => { ... };