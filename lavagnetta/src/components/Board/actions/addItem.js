// src/components/Board/actions/addItem.js
import api from '../../../services/api';
import { toast } from 'react-toastify';

/**
 * Aggiunge un nuovo elemento alla lavagna (personale o di gruppo).
 * @param {string} newItem - Nome del nuovo elemento.
 * @param {Array} items - Lista attuale degli elementi (NON USATO).
 * @param {Function} setItems - Funzione per aggiornare lo stato UI (usata solo per fallback).
 * @param {Function} setNewItem - Funzione per resettare il campo di input.
 * @param {Object} board - L'oggetto lavagna selezionata (con id, isGroupContext, groupId?, userRoleInGroup?, isDefaultGroupBoard?).
 * @param {any} suggestions - Non usato qui.
 * @param {Function | null} onDataRefreshNeeded - Callback per triggerare il refresh nel genitore, passando l'actionCompletionTimestamp.
 * @returns {Promise<Object>} - La Promise risolve con i dati del nuovo prodotto (incluso il timestamp se restituito dall'API).
 */
export const addItem = async (newItem, items, setItems, setNewItem, board, suggestions, onDataRefreshNeeded) => {
    // --- Validazioni Iniziali ---
    if (!board || typeof board.id !== 'number' || board.id <= 0) {
        const errorMsg = "Errore interno: ID lavagna mancante o non valido per addItem.";
        console.error(errorMsg, board);
        toast.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }
    const trimmedNewItem = newItem.trim();
    if (trimmedNewItem === '') {
        toast.error("Il nome dell'elemento non può essere vuoto.");
        return Promise.reject(new Error("Nome vuoto"));
    }

    // --- Controllo Permessi Frontend ---
    if (board.isGroupContext && board.userRoleInGroup === 'level2' && board.isDefaultGroupBoard) {
        const errorMsg = "Non puoi aggiungere elementi alla lavagna di default del gruppo come Contributor.";
        toast.warn(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }

    // --- Costruzione URL API Dinamica ---
    let apiUrl;
    const numericBoardId = board.id;
    if (board.isGroupContext) {
        const numericGroupId = parseInt(board.groupId);
        if (isNaN(numericGroupId) || numericGroupId <= 0) {
            const errorMsg = `Errore interno: groupId non valido (${board.groupId}) per addItem in contesto gruppo.`;
            console.error(errorMsg, board); toast.error(errorMsg);
            return Promise.reject(new Error("GroupId non valido"));
        }
        apiUrl = `/auth/groups/${numericGroupId}/boards/${numericBoardId}/products`;
    } else {
        apiUrl = `/auth/boards/${numericBoardId}/products`;
    }
    console.log(`[addItem Action] Calling API: POST ${apiUrl} with name: ${trimmedNewItem}`);

    // --- Chiamata API ---
    try {
        // ** Cattura la risposta **
        const response = await api.post(apiUrl, {
            name: trimmedNewItem,
            is_purchased: false,
        });

        const newProductData = response.data;

        // Verifica robusta della risposta
        if (!newProductData || typeof newProductData !== 'object' || !newProductData.id || typeof newProductData.name !== 'string') {
            console.error("[addItem Action] Risposta API non valida dopo creazione:", newProductData);
            throw new Error("Risposta non valida dal server dopo creazione prodotto.");
        }
        newProductData.is_purchased = !!newProductData.is_purchased;
        console.log(`[addItem Action] Prodotto ${newProductData.id} creato con successo (API).`);

        // **MODIFICA: Estrai il timestamp e chiama onDataRefreshNeeded**
        // ADATTA IL NOME DELLA PROPRIETA'!
        const completionTs = newProductData.actionCompletionTimestamp || newProductData.updated_at_timestamp || null;

        if (completionTs) {
            console.log(`[addItem Action] Timestamp ricevuto dal backend: ${completionTs}`);
        } else {
            console.warn(`[addItem Action] Timestamp non trovato nella risposta API POST. L'auto-notifica potrebbe non essere evitata.`);
        }

        // **MODIFICA: Passa il timestamp (o null) alla callback**
        if (typeof onDataRefreshNeeded === 'function') {
            console.log(`[addItem Action] Chiamo onDataRefreshNeeded con TS: ${completionTs}...`);
            onDataRefreshNeeded(completionTs); // Passa il timestamp!
        } else {
            // Fallback se la callback non è fornita
            console.warn("[addItem Action] onDataRefreshNeeded non fornito. Aggiorno stato locale (fallback).");
            if (typeof setItems === 'function') {
                setItems(prevItems => [...prevItems, newProductData]);
            } else {
                console.error("[addItem Action] Né onDataRefreshNeeded né setItems forniti.");
            }
        }

        // Resetta il campo input
        if (typeof setNewItem === 'function') {
            setNewItem('');
        }

        // Restituisce i dati del nuovo prodotto
        return newProductData;

    } catch (error) {
        console.error("[addItem Action] Errore API:", error);
        toast.error(error.response?.data?.error || error.response?.data?.message || "Errore nell'aggiunta dell'elemento.");
        throw error;
    }
};
//ultimo ok