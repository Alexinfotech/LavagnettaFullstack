// src/controllers/noteController.js
const noteService = require('../services/noteServices/noteService');
const { validationResult } = require('express-validator'); // Importa se usi express-validator qui

/**
 * Recupera tutte le note per l'utente autenticato. (INVARIATO NEL FUNZIONAMENTO BASE)
 */
exports.getNotes = async (req, res) => {
    try {
        // console.log(`[noteCtrl] Recupero note per utente ID: ${req.user.id}`);
        const notes = await noteService.getUserNotes(req.user.id);
        // console.log(`[noteCtrl] Note recuperate: ${notes.length}`);

        // Invariato: restituisce l'oggetto { notes: [...] }
        res.set('Cache-Control', 'no-store'); // Semplificato header cache
        res.status(200).json({ notes });
    } catch (error) {
        console.error('[noteCtrl] Errore recupero note:', error);
        res.status(500).json({ error: 'Errore nel recuperare le note.' });
    }
};

/**
 * Crea una nuova nota per l'utente.
 */
exports.createNote = async (req, res) => {
    // Opzionale: Validazione con express-validator se la rotta lo include
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }

    try {
        // --- MODIFICA: Estrai i nuovi campi dal body ---
        const { title, content, date, expense_amount, location, item_count } = req.body; // Nomi snake_case come le colonne DB
        const userId = req.user.id;

        console.log(`[noteCtrl] Creazione nota per utente ID: ${userId}`);

        // --- MODIFICA: Passa i nuovi campi (anche se undefined) al service ---
        const newNote = await noteService.createNote(
            userId,
            title, // Assumiamo che title e date siano sempre richiesti dalla validazione rotta
            content,
            date,
            expense_amount, // Verrà gestito come NULL dal service se undefined/null/''
            location,       // Verrà gestito come NULL dal service se undefined/null/''
            item_count      // Verrà gestito come NULL dal service se undefined/null/''
        );

        console.log(`[noteCtrl] Nuova nota creata con ID: ${newNote.id}`);
        res.set('Cache-Control', 'no-store');
        res.status(201).json({ note: newNote }); // Restituisce la nota completa creata
    } catch (error) {
        console.error('[noteCtrl] Errore creazione nota:', error);
        // Se l'errore viene dal service per input non valido, restituisci 400
        if (error.message.includes("non è un numero valido") || error.message.includes("non è un intero valido")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Errore nella creazione della nota.' });
        }
    }
};

/**
 * Aggiorna una nota esistente.
 */
exports.updateNote = async (req, res) => {
    // Opzionale: Validazione con express-validator
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }

    try {
        // --- MODIFICA: Estrai i nuovi campi dal body ---
        const { title, content, date, expense_amount, location, item_count } = req.body;
        const noteId = req.params.id; // Prendi l'ID dai parametri della rotta
        const userId = req.user.id;

        console.log(`[noteCtrl] Aggiornamento nota ID: ${noteId} per utente ID: ${userId}`);

        // --- MODIFICA: Passa i nuovi campi (anche se undefined) al service ---
        const updatedNote = await noteService.updateNote(
            userId,
            noteId,
            title, // Assumiamo title e date sempre presenti/richiesti
            content,
            date,
            expense_amount,
            location,
            item_count
        );

        if (updatedNote) {
            console.log(`[noteCtrl] Nota ${noteId} aggiornata.`);
            res.set('Cache-Control', 'no-store');
            res.status(200).json({ note: updatedNote }); // Restituisce la nota aggiornata
        } else {
            console.log(`[noteCtrl] Nota ${noteId} non trovata per l'aggiornamento.`);
            res.status(404).json({ error: 'Nota non trovata.' });
        }
    } catch (error) {
        console.error(`[noteCtrl] Errore aggiornamento nota ID ${req.params.id}:`, error);
        // Se l'errore viene dal service per input non valido, restituisci 400
        if (error.message.includes("non è un numero valido") || error.message.includes("non è un intero valido")) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Errore nell\'aggiornamento della nota.' });
        }
    }
};

/**
 * Elimina una nota. (INVARIATO)
 */
exports.deleteNote = async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.user.id;
        console.log(`[noteCtrl] Eliminazione nota ID: ${noteId} per utente ID: ${userId}`);
        const result = await noteService.deleteNote(userId, noteId);
        if (result) {
            console.log(`[noteCtrl] Nota ${noteId} eliminata.`);
            res.set('Cache-Control', 'no-store');
            res.status(200).json({ message: 'Nota eliminata con successo.' });
        } else {
            console.log(`[noteCtrl] Nota ${noteId} non trovata per l'eliminazione.`);
            res.status(404).json({ error: 'Nota non trovata.' });
        }
    } catch (error) {
        console.error(`[noteCtrl] Errore eliminazione nota ID ${req.params.id}:`, error);
        res.status(500).json({ error: 'Errore nell\'eliminazione della nota.' });
    }
};