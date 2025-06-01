// src/components/Header/actions/fetchBoards.js

import api from '../../../services/api';
// Rimosso: import { toast } from 'react-toastify'; // Non più necessario qui

/**
 * Recupera SOLO le lavagnette PERSONALI dell'utente.
 * @param {Function} setBoards - Funzione per impostare le lavagnette nello stato del componente Header/App.
 */
export const fetchBoards = async (setBoards) => {
    try {
        // Chiama l'endpoint corretto per le lavagne personali
        const response = await api.get('/auth/boards/personal');
        setBoards(response.data || []); // Imposta le lavagne recuperate
        console.log("Header/fetchBoards: Lavagne personali caricate:", response.data?.length ?? 0);
    } catch (error) {
        console.error('Errore nel recuperare le lavagnette personali (Header/fetchBoards):', error);
        // L'eventuale notifica di errore all'utente viene gestita a livello superiore (es. in App.jsx)
        setBoards([]); // Resetta in caso di errore per evitare dati inconsistenti
    }
};

// Non esportiamo più la funzione come default se non necessario
// export default fetchBoards; // Rimuovi o commenta se non usi l'export default altrove

// Se preferisci mantenere l'export standard non-default
// export { fetchBoards }; // Già esportata con 'export const' sopra