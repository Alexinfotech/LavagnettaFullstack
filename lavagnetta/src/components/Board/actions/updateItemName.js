// src/components/Board/actions/updateItemName.js
import api from '../../../services/api';
import { toast } from 'react-toastify';

/**
 * Aggiorna il nome di un prodotto esistente.
 * @param {number} index - Indice dell'elemento nell'array originale.
 * @param {string} editedName - Nuovo nome (già trimmato e validato non vuoto).
 * @param {Array} originalItems - Array originale degli elementi prima dell'azione.
 * @param {Function} setItems - Funzione per aggiornare l'UI (ottimismo/rollback).
 * @param {Function} setEditingIndex - Funzione per uscire dalla modalità edit.
 * @param {Function} setEditedName - Funzione per resettare il campo editato.
 * @param {Object} board - L'oggetto lavagna selezionata.
 * @param {Function | null} onDataRefreshNeeded - Callback da chiamare DOPO successo API, passando l'actionCompletionTimestamp.
 * @returns {Promise<void>}
 */
export const updateItemName = async (
    index,
    editedName, // Assumiamo sia già trimmato e validato dal chiamante (Board.jsx)
    originalItems,
    setItems,
    setEditingIndex,
    setEditedName,
    board,
    onDataRefreshNeeded
) => {
    // --- Validazioni Iniziali Robuste ---
    if (!board || typeof board.id !== 'number' || board.id <= 0) {
        console.error("[updateItemName Action] Errore: Oggetto 'board' o 'board.id' mancante o non valido.", board);
        toast.error("Errore interno: ID Lavagna mancante.");
        return Promise.reject(new Error("ID Lavagna mancante"));
    }
    const item = originalItems[index];
    if (!item || typeof item.id !== 'number' || item.id <= 0) {
        console.error("[updateItemName Action] Errore: Oggetto 'item' o 'item.id' non valido all'indice.", index, originalItems);
        toast.error("Errore interno: Elemento non valido.");
        return Promise.reject(new Error("Elemento non valido"));
    }
    // Il controllo nome vuoto e nome non modificato è già fatto in Board.jsx prima di chiamare questa action.

    // --- Controllo Permessi Frontend Specifico per Gruppi ---
    // Questo controllo è ridondante se Board.jsx già lo fa prima di attivare l'edit, ma lo teniamo per sicurezza.
    if (board.isGroupContext === true) {
        if (typeof board.userRoleInGroup === 'undefined' || typeof board.isDefaultGroupBoard === 'undefined' || typeof board.groupId === 'undefined') {
            console.error("[updateItemName Action] Errore: Dati permessi/ID gruppo mancanti in 'board'.", board);
            toast.error("Errore interno: Dati gruppo incompleti.");
            return Promise.reject(new Error("Dati permessi gruppo mancanti"));
        }
        // Regola: level2 non può modificare nome (canEdit sarà false in Board.jsx, quindi non dovrebbe arrivare qui)
        // Aggiungiamo comunque un controllo difensivo
        if (board.userRoleInGroup === 'level2') {
            toast.warn("I Contributor non possono modificare i nomi dei prodotti.");
            // Potremmo non voler rigettare qui se l'UI lo ha già impedito, ma è più sicuro
            return Promise.reject(new Error("Permesso negato (level2)"));
        }
        // Controllo (probabilmente non necessario qui se gestito in _checkProductPermissions nel backend)
        // if (board.userRoleInGroup === 'level2' && board.isDefaultGroupBoard === true) {
        //     toast.warn("I Contributor non possono modificare elementi nella lavagna di default.");
        //     return Promise.reject(new Error("Permesso negato"));
        // }
    }

    const productId = item.id;
    const optimisticUpdatedItem = { ...item, name: editedName }; // Usa il nome già trimmato

    // --- Aggiornamento Ottimistico UI ---
    if (typeof setItems === 'function') {
        console.log(`[updateItemName Action] Aggiornamento UI ottimistico per item ${productId} a "${editedName}"`);
        setItems(prevItems => prevItems.map((it, i) => i === index ? optimisticUpdatedItem : it));
    } else {
        console.warn("[updateItemName Action] Funzione setItems non fornita.");
    }
    // Esci dalla modalità modifica subito
    if (typeof setEditingIndex === 'function') setEditingIndex(null);
    if (typeof setEditedName === 'function') setEditedName('');

    // --- Costruzione URL API ---
    let apiUrl;
    const numericBoardId = board.id;
    const numericProductId = productId;
    if (board.isGroupContext === true) {
        const numericGroupId = parseInt(board.groupId);
        if (isNaN(numericGroupId) || numericGroupId <= 0) {
            console.error(`[updateItemName Action] Errore: ID Gruppo (${board.groupId}) non valido.`);
            toast.error("Errore interno: ID Gruppo non valido.");
            if (typeof setItems === 'function') setItems(originalItems); // Rollback
            return Promise.reject(new Error("ID Gruppo non valido"));
        }
        apiUrl = `/auth/groups/${numericGroupId}/boards/${numericBoardId}/products/${numericProductId}`;
    } else {
        apiUrl = `/auth/boards/${numericBoardId}/products/${numericProductId}`;
    }
    console.log(`[updateItemName Action] Preparing API Call: PUT ${apiUrl} with payload: { name: "${editedName}" }`);

    // --- Chiamata API ---
    try {
        // **MODIFICA: Cattura la risposta per ottenere il timestamp**
        const response = await api.put(apiUrl, { name: editedName }); // Passa nome già trimmato

        console.log(`[updateItemName Action] API Call successful for product ${productId}. Status: ${response.status}`);
        toast.success(`Nome aggiornato a "${editedName}"!`);

        // **MODIFICA: Estrai actionCompletionTimestamp dalla risposta API**
        const responseData = response.data;
        // Adatta il nome della proprietà!
        const completionTs = responseData?.actionCompletionTimestamp || responseData?.updated_at_timestamp || null;

        if (completionTs) {
            console.log(`[updateItemName Action] Timestamp ricevuto dal backend: ${completionTs}`);
        } else {
            console.warn(`[updateItemName Action] Timestamp non trovato nella risposta API PUT. L'auto-notifica potrebbe non essere evitata.`);
        }

        // **MODIFICA: Passa il timestamp alla callback**
        if (typeof onDataRefreshNeeded === 'function') {
            console.log(`[updateItemName Action] Calling onDataRefreshNeeded con TS: ${completionTs}...`);
            onDataRefreshNeeded(completionTs); // Passa il timestamp (o null)
        } else {
            console.error("[updateItemName Action] Callback onDataRefreshNeeded non fornita.");
            // L'aggiornamento ottimistico è già avvenuto.
        }

        return Promise.resolve(); // Successo

    } catch (error) {
        console.error("[updateItemName Action] API Call failed:", error);
        const errorMsg = error.response?.data?.error || error.response?.data?.message || "Errore nell'aggiornamento del nome.";
        toast.error(errorMsg);

        // --- Rollback UI Ottimistico ---
        if (typeof setItems === 'function') {
            console.log("[updateItemName Action] Rolling back optimistic UI update due to API error...");
            setItems(originalItems); // Ripristina l'array originale
        } else {
            console.error("[updateItemName Action] API error occurred, but setItems function is not available.");
        }

        throw error; // Rilancia l'errore
    }
};
//ultimo ok