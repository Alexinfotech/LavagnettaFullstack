// src/services/statisticsService.js

const pool = require('../config/db'); // Assicurati che il percorso sia corretto

class StatisticsService {

    /**
     * Calcola le statistiche di riepilogo (totali, medie).
     * @param {number} userId
     * @param {Date|undefined} startDate
     * @param {Date|undefined} endDate
     * @param {string|undefined} location
     * @returns {Promise<object>} Oggetto con le statistiche calcolate.
     */
    async calculateSummaryStats(userId, startDate, endDate, location) {
        console.log(`[statsService] Calcolo Summary - User: ${userId}`);
        let query = `
            SELECT
                COUNT(*) AS totalEntries,                      -- Numero totale di note/spese nel periodo/filtro
                SUM(CASE WHEN expense_amount > 0 THEN 1 ELSE 0 END) AS totalExpenseEntries, -- Numero di voci che sono spese effettive
                SUM(expense_amount) AS totalExpenseAmount,     -- Somma totale degli importi
                SUM(item_count) AS totalItemCount,             -- Somma totale del numero di prodotti
                AVG(expense_amount) AS averageExpenseAmount,   -- Spesa media per singola registrazione di spesa
                (SUM(expense_amount) / NULLIF(SUM(item_count), 0)) AS averageItemCost -- Costo medio per singolo item (usa NULLIF per evitare divisione per zero)
            FROM notes
            WHERE user_id = ?
              AND expense_amount IS NOT NULL -- Considera solo le note che hanno un importo spesa
        `;
        const params = [userId];

        // Aggiungi filtri opzionali
        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate.toISOString().split('T')[0]); // Formato YYYY-MM-DD
        }
        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate.toISOString().split('T')[0]); // Formato YYYY-MM-DD
        }
        if (location) {
            query += ` AND location LIKE ?`; // Usa LIKE per ricerche parziali? O = ? per esatto.
            params.push(`%${location}%`);    // Adatta se usi =
        }

        try {
            console.log("[statsService] Eseguo Query Summary:", query, params);
            const [rows] = await pool.execute(query, params);
            const result = rows[0];

            // Formatta i risultati (converte null in 0 dove appropriato, formatta decimali)
            const summary = {
                totalEntries: parseInt(result.totalEntries || 0),
                totalExpenseEntries: parseInt(result.totalExpenseEntries || 0),
                totalExpenseAmount: parseFloat(result.totalExpenseAmount || 0).toFixed(2),
                totalItemCount: parseInt(result.totalItemCount || 0),
                averageExpenseAmount: parseFloat(result.averageExpenseAmount || 0).toFixed(2),
                averageItemCost: parseFloat(result.averageItemCost || 0).toFixed(2),
                // Potresti aggiungere qui anche il recupero del negozio più frequente/costoso con subquery o altra query
            };
            console.log("[statsService] Risultato Summary:", summary);
            return summary;

        } catch (error) {
            console.error('[statsService] Errore calculateSummaryStats:', error);
            throw new Error('Errore nel calcolo delle statistiche di riepilogo.');
        }
    }

    /**
     * Calcola i dati aggregati per grafici temporali.
     * @param {number} userId
     * @param {Date|undefined} startDate
     * @param {Date|undefined} endDate
     * @param {string|undefined} location
     * @param {'month'|'day'} groupBy - Raggruppamento (mese o giorno).
     * @returns {Promise<Array>} Array di oggetti { timePeriod: 'YYYY-MM' o 'YYYY-MM-DD', totalAmount: N }
     */
    async calculateTimeSeriesStats(userId, startDate, endDate, location, groupBy = 'month') {
        console.log(`[statsService] Calcolo TimeSeries (groupBy: ${groupBy}) - User: ${userId}`);

        // Determina il formato della data per GROUP BY e SELECT
        const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';

        let query = `
            SELECT
                DATE_FORMAT(date, ?) AS timePeriod,  -- Formato data per raggruppamento
                SUM(expense_amount) AS totalAmount     -- Somma importi per periodo
            FROM notes
            WHERE user_id = ?
              AND expense_amount IS NOT NULL AND expense_amount > 0 -- Considera solo spese valide
        `;
        const params = [dateFormat, userId]; // Primo parametro è il formato data

        // Filtri opzionali
        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate.toISOString().split('T')[0]);
        }
        if (location) {
            query += ` AND location LIKE ?`;
            params.push(`%${location}%`);
        }

        query += `
            GROUP BY timePeriod
            ORDER BY timePeriod ASC
        `; // Raggruppa e ordina per periodo

        try {
            console.log("[statsService] Eseguo Query TimeSeries:", query, params);
            const [rows] = await pool.execute(query, params);

            // Formatta i risultati per Chart.js (assicura numeri)
            const timeSeriesData = rows.map(row => ({
                timePeriod: row.timePeriod,
                totalAmount: parseFloat(row.totalAmount || 0) // Converte in numero, default 0
            }));

            console.log(`[statsService] Risultato TimeSeries: ${timeSeriesData.length} periodi`);
            return timeSeriesData;

        } catch (error) {
            console.error('[statsService] Errore calculateTimeSeriesStats:', error);
            throw new Error('Errore nel calcolo delle statistiche temporali.');
        }
    }


    /**
    * Calcola i dati aggregati per luogo/negozio.
    * @param {number} userId
    * @param {Date|undefined} startDate
    * @param {Date|undefined} endDate
    * @returns {Promise<Array>} Array di oggetti { location: 'Nome Negozio', totalAmount: N, entryCount: N }
    */
    async calculateStatsByLocation(userId, startDate, endDate) {
        console.log(`[statsService] Calcolo ByLocation - User: ${userId}`);

        let query = `
            SELECT
                location,                                  -- Nome del luogo/negozio
                SUM(expense_amount) AS totalAmount,        -- Somma importi per luogo
                COUNT(*) AS entryCount                     -- Numero di spese per luogo
            FROM notes
            WHERE user_id = ?
              AND expense_amount IS NOT NULL AND expense_amount > 0 -- Solo spese valide
              AND location IS NOT NULL AND location <> ''      -- Solo record con un luogo specificato
        `;
        const params = [userId];

        // Filtri opzionali per data
        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate.toISOString().split('T')[0]);
        }

        query += `
            GROUP BY location
            ORDER BY totalAmount DESC -- Ordina per spesa maggiore
        `;

        try {
            console.log("[statsService] Eseguo Query ByLocation:", query, params);
            const [rows] = await pool.execute(query, params);

            // Formatta i risultati
            const locationData = rows.map(row => ({
                location: row.location,
                totalAmount: parseFloat(row.totalAmount || 0),
                entryCount: parseInt(row.entryCount || 0)
            }));

            console.log(`[statsService] Risultato ByLocation: ${locationData.length} luoghi`);
            return locationData;

        } catch (error) {
            console.error('[statsService] Errore calculateStatsByLocation:', error);
            throw new Error('Errore nel calcolo delle statistiche per luogo.');
        }
    }


    // Aggiungeremo qui le funzioni per l'export più avanti
    // async exportCsvData(...)
    // async generatePdfSummary(...)

}

module.exports = new StatisticsService(); // Esporta istanza della classe