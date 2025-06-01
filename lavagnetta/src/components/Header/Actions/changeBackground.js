// src/components/Header/actions/changeBackground.js

import api from '../../../services/api';
import { toast } from 'react-toastify';

export const changeBackground = async (
    background, // Nuovo sfondo selezionato
    selectedBoard, // Oggetto lavagna attuale
    setSelectedBackground, // Funzione per aggiornare lo stato dello sfondo selezionato nell'UI
    setSelectedBoard, // Funzione per aggiornare l'oggetto board selezionato nell'UI
    boards, // Array completo delle lavagne (per aggiornare l'array generale)
    setBoards // Funzione per aggiornare l'array generale delle lavagne
) => {
    if (!selectedBoard) {
        toast.error("Nessuna lavagna selezionata per cambiare lo sfondo.");
        return; // Esce se non c'è una lavagna selezionata
    }
    if (!background) {
        toast.warn("Seleziona uno sfondo valido.");
        return; // Esce se lo sfondo non è valido
    }

    // --- OTTIMIZZAZIONE: Crea un payload solo con il campo da aggiornare ---
    const payload = { background: background };
    // --- FINE OTTIMIZZAZIONE ---

    try {
        console.log(`Attempting to update background for board ${selectedBoard.id} to ${background}`);
        // --- MODIFICA: Invia solo il payload ottimizzato ---
        const response = await api.put(`/auth/boards/${selectedBoard.id}`, payload);
        // --- FINE MODIFICA ---

        // Verifica che la risposta contenga i dati attesi
        if (response.data && response.data.background) {
            const updatedBoardData = response.data; // L'API dovrebbe restituire la lavagna aggiornata

            // Aggiorna lo stato dello sfondo selezionato (per il dropdown)
            setSelectedBackground(updatedBoardData.background);

            // Aggiorna l'oggetto 'selectedBoard' nello stato dell'App/Header
            setSelectedBoard(updatedBoardData); // Usa direttamente i dati freschi dal backend

            // Aggiorna l'array 'boards' nello stato dell'App/Header
            setBoards(
                boards.map((board) =>
                    board.id === selectedBoard.id ? updatedBoardData : board
                )
            );

            // Aggiorna anche localStorage se necessario (per persistere la selezione tra refresh)
            localStorage.setItem("selectedBoard", JSON.stringify(updatedBoardData));

            toast.success('Sfondo della lavagnetta aggiornato con successo.');
        } else {
            // Se la risposta non ha i dati attesi, segnala un problema
            console.error('Risposta API per cambio sfondo non valida:', response);
            toast.error('Errore nell\'aggiornamento dello sfondo: risposta API non valida.');
        }

    } catch (error) {
        console.error(`Errore nell'aggiornamento dello sfondo per board ${selectedBoard.id}:`, error);
        // Mostra un errore più specifico se possibile
        const errorMessage = error.response?.data?.error || error.message || "Errore nell'aggiornamento dello sfondo.";
        toast.error(errorMessage);

        // Nota: Non ripristinare lo stato precedente qui, potrebbe causare discrepanze se l'errore
        // non è dovuto a un fallimento completo ma a una risposta malformata.
        // L'utente vedrà l'errore e potrà riprovare.
    }
};