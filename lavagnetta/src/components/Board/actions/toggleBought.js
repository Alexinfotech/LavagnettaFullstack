// src/components/Board/actions/toggleBought.js
import api from '../../../services/api';
import { toast } from 'react-toastify';

/**
 * Esegue il toggle dello stato 'is_purchased' di un prodotto.
 * @param {number} index - Indice dell'elemento nell'array originale.
 * @param {Array} originalItems - Array originale degli elementi.
 * @param {Function} setItems - Funzione per aggiornare l'UI (usata per l'ottimismo e il rollback).
 * @param {Object} board - L'oggetto lavagna selezionata (contiene id, isGroupContext, groupId).
 * @param {Function | null} onDataRefreshNeeded - Callback da chiamare DOPO successo API, passando l'actionCompletionTimestamp.
 * @returns {Promise<void>}
 */
export const toggleBought = async (index, originalItems, setItems, board, onDataRefreshNeeded) => {
    console.log('[toggleBought Action Entry] typeof onDataRefreshNeeded ricevuto:', typeof onDataRefreshNeeded);

    // --- Validazioni Iniziali ---
    if (!board || typeof board.id !== 'number' || board.id <= 0) {
        const errorMsg = "Errore interno: ID lavagna mancante o non valido per toggleBought.";
        console.error(errorMsg, board);
        toast.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }
    const item = originalItems[index];
    if (!item || typeof item.id !== 'number' || item.id <= 0) {
        const errorMsg = "Errore interno: Elemento non valido per toggleBought.";
        console.error(errorMsg, originalItems, index);
        toast.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }

    const newPurchasedState = !item.is_purchased;
    const productId = item.id;
    const optimisticUpdatedItem = { ...item, is_purchased: newPurchasedState };

    // --- Aggiornamento Ottimistico UI ---
    if (typeof setItems === 'function') {
        console.log("[toggleBought Action] Aggiornamento UI ottimistico...");
        setItems(prevItems => prevItems.map((it, i) => i === index ? optimisticUpdatedItem : it));
    }

    // --- Costruzione URL API Dinamica ---
    let apiUrl;
    const numericBoardId = board.id;
    const numericProductId = productId;

    if (board.isGroupContext) {
        const numericGroupId = parseInt(board.groupId);
        if (isNaN(numericGroupId) || numericGroupId <= 0) {
            const errorMsg = `Errore interno: groupId non valido (${board.groupId}) per toggleBought.`;
            console.error(errorMsg, board); toast.error(errorMsg);
            if (typeof setItems === 'function') setItems(originalItems); // Rollback
            return Promise.reject(new Error("GroupId non valido"));
        }
        apiUrl = `/auth/groups/${numericGroupId}/boards/${numericBoardId}/products/${numericProductId}`;
    } else {
        apiUrl = `/auth/boards/${numericBoardId}/products/${numericProductId}`;
    }
    console.log(`[toggleBought Action] Calling API: PUT ${apiUrl} with is_purchased: ${newPurchasedState}`);

    // --- Chiamata API ---
    try {
        const response = await api.put(apiUrl, {
            is_purchased: newPurchasedState
            // Inviare anche 'name: item.name' qui può essere utile se l'API
            // di update gestisce entrambi i campi e si vuole evitare che
            // venga resettato a null nel DB se non specificato.
            // Dipende da come è implementata l'API PUT.
            // Se l'API aggiorna SOLO i campi forniti, non serve.
            // name: item.name // OPZIONALE: Invia anche il nome corrente
        });

        console.log(`[toggleBought Action] Stato prodotto ${productId} aggiornato con successo (API). Status: ${response.status}`);

        // Estrai actionCompletionTimestamp dalla risposta API
        const responseData = response.data;
        // ** Semplificato per usare solo il nome corretto del campo **
        const actionCompletionTimestamp = responseData?.actionCompletionTimestamp || null;

        if (actionCompletionTimestamp) {
            console.log(`[toggleBought Action] Timestamp ricevuto dal backend: ${actionCompletionTimestamp}`);
        } else {
            // Questo warning indica un problema nel backend se dovesse apparire
            console.warn(`[toggleBought Action] ATTENZIONE: Timestamp 'actionCompletionTimestamp' non trovato nella risposta API PUT. L'auto-notifica potrebbe non essere evitata correttamente.`);
        }

        // Passa il timestamp (o null) alla callback
        if (typeof onDataRefreshNeeded === 'function') {
            console.log(`[toggleBought Action] Chiamo onDataRefreshNeeded con TS: ${actionCompletionTimestamp}...`);
            onDataRefreshNeeded(actionCompletionTimestamp);
        } else {
            console.error("[toggleBought Action] ERRORE: Callback onDataRefreshNeeded non fornita. Impossibile segnalare azione completata al genitore.");
            // Se onDataRefreshNeeded non c'è, l'update ottimistico rimane
            // ma il refresh generale non verrà triggerato, causando potenziale
            // desincronizzazione se qualcun altro modifica nel frattempo.
        }

        // Non c'è bisogno di aggiornare setItems qui se onDataRefreshNeeded viene chiamato,
        // perché il genitore triggererà un refresh completo che aggiornerà gli items.
        // Lasciare l'update ottimistico è generalmente buono per la reattività percepita.

        return Promise.resolve(); // Successo

    } catch (error) {
        console.error('[toggleBought Action] Errore API:', error);
        toast.error(error.response?.data?.error || error.response?.data?.message || 'Errore aggiornamento stato prodotto.');

        // Rollback UI Ottimistico
        if (typeof setItems === 'function') {
            console.log("[toggleBought Action] Rollback UI ottimistico...");
            setItems(originalItems); // Ripristina lo stato precedente
        }

        throw error; // Rilancia l'errore
    }
};