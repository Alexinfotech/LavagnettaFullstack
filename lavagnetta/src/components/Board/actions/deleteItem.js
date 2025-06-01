// src/components/Board/actions/deleteItem.js
import api from '../../../services/api';
import { toast } from 'react-toastify';

/**
 * Elimina un elemento dalla lavagna (personale o di gruppo) DOPO conferma esterna.
 * @param {number} index - Indice dell'elemento nell'array originale.
 * @param {Array} originalItems - Array originale degli elementi.
 * @param {Function} setItems - Funzione per aggiornare lo stato locale (usata solo per fallback).
 * @param {Object} board - L'oggetto lavagna selezionata (con id, isGroupContext, groupId?, userRoleInGroup?, isDefaultGroupBoard?).
 * @param {Function | null} onDataRefreshNeeded - Callback per triggerare il refresh nel genitore, passando l'actionCompletionTimestamp.
 * @returns {Promise<void>} - La Promise risolve se l'eliminazione ha successo, altrimenti rigetta.
 */
export const deleteItem = async (index, originalItems, setItems, board, onDataRefreshNeeded) => {
    // --- Validazioni Iniziali ---
    if (!board || typeof board.id !== 'number' || board.id <= 0) {
        const errorMsg = "Errore interno: ID lavagna mancante per deleteItem.";
        console.error(errorMsg, board);
        toast.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }
    const itemToDelete = originalItems[index];
    if (!itemToDelete || typeof itemToDelete.id !== 'number' || itemToDelete.id <= 0) {
        const errorMsg = "Errore interno: Impossibile trovare l'elemento da eliminare o ID non valido.";
        console.error(errorMsg, originalItems, index);
        toast.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
    }

    // --- Controllo Permessi Frontend ---
    // Adatta questa logica se le regole per delete sono diverse da add/toggle
    if (board.isGroupContext && board.userRoleInGroup === 'level2') {
        // Ad esempio, se level2 non può MAI eliminare in gruppi:
        const errorMsg = "Non hai i permessi per eliminare elementi in questo gruppo.";
        toast.warn(errorMsg);
        return Promise.reject(new Error(errorMsg));
        // Se invece il permesso dipende da isDefaultGroupBoard (come in _checkProductPermissions):
        // if (board.isDefaultGroupBoard) {
        //     const errorMsg = "I Contributor non possono eliminare elementi dalla lavagna di default.";
        //     toast.warn(errorMsg);
        //     return Promise.reject(new Error(errorMsg));
        // }
    }
    // --- Fine Controllo Permessi ---

    // --- Costruzione URL API Dinamica ---
    let apiUrl;
    const productId = itemToDelete.id;
    const numericBoardId = board.id; // Già validato

    if (board.isGroupContext) {
        const numericGroupId = parseInt(board.groupId);
        if (isNaN(numericGroupId) || numericGroupId <= 0) {
            const errorMsg = `Errore interno: groupId non valido (${board.groupId}) per deleteItem in contesto gruppo.`;
            console.error(errorMsg, board); toast.error(errorMsg);
            return Promise.reject(new Error("GroupId non valido"));
        }
        apiUrl = `/auth/groups/${numericGroupId}/boards/${numericBoardId}/products/${productId}`;
    } else {
        apiUrl = `/auth/boards/${numericBoardId}/products/${productId}`;
    }
    console.log(`[deleteItem Action] Calling API: DELETE ${apiUrl}`);
    // --- Fine Costruzione URL ---

    try {
        // **MODIFICA: Cattura la risposta per ottenere il timestamp (se restituito)**
        const response = await api.delete(apiUrl);

        // Verifica status (200 OK o 204 No Content sono tipici per DELETE)
        if (response.status === 200 || response.status === 204) {
            console.log(`[deleteItem Action] Prodotto ${productId} eliminato con successo (API). Status: ${response.status}`);

            // **MODIFICA: Estrai actionCompletionTimestamp dalla risposta API**
            // L'API DELETE POTREBBE non restituire un corpo.
            // Idealmente, dovrebbe restituire il timestamp aggiornato della board/gruppo
            // nel corpo JSON o in un header custom (es. 'X-Last-Update-Timestamp').
            const responseData = response.data; // Potrebbe essere vuoto o undefined
            // Adatta il nome della proprietà qui sotto!
            const completionTs = responseData?.actionCompletionTimestamp || responseData?.updated_at_timestamp || null;
            // Alternativa se fosse in un header: const completionTsHeader = response.headers?.['x-last-update-timestamp']; const completionTs = completionTsHeader ? parseInt(completionTsHeader) : null;

            if (completionTs) {
                console.log(`[deleteItem Action] Timestamp ricevuto dal backend: ${completionTs}`);
            } else {
                console.warn(`[deleteItem Action] Timestamp non trovato nella risposta API DELETE. L'auto-notifica potrebbe non essere evitata correttamente.`);
                // Qui NON possiamo usare Date.now() perché non rifletterebbe l'aggiornamento del server
            }

            // **MODIFICA: Chiama la callback con il timestamp (o null)**
            if (typeof onDataRefreshNeeded === 'function') {
                console.log(`[deleteItem Action] Chiamo onDataRefreshNeeded con TS: ${completionTs}...`);
                onDataRefreshNeeded(completionTs); // Passa il timestamp (o null)
            } else {
                // Fallback: aggiorna stato locale
                console.warn("[deleteItem Action] onDataRefreshNeeded non fornito. Aggiorno stato locale (fallback).");
                if (typeof setItems === 'function') {
                    setItems(prevItems => prevItems.filter((_, i) => i !== index));
                } else {
                    console.error("[deleteItem Action] Né onDataRefreshNeeded né setItems forniti.");
                }
            }

            toast.success(`"${itemToDelete.name}" eliminato.`);
            return Promise.resolve(); // Successo

        } else {
            // Caso di risposta inattesa (es. 500 senza eccezione, o altri status non gestiti)
            console.error("[deleteItem Action] Risposta API inattesa:", response);
            throw new Error(`Risposta API non valida (Status: ${response.status}) dopo l'eliminazione.`);
        }
    } catch (error) {
        console.error("[deleteItem Action] Errore API:", error);
        toast.error(error.response?.data?.error || error.response?.data?.message || "Errore nella rimozione dell'elemento.");
        // Non c'è UI ottimistica da revertire in questo caso specifico
        throw error; // Rilancia l'errore
    }
};
//ultimo ok