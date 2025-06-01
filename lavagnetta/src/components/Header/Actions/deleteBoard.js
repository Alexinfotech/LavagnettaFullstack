// src/components/Header/actions/deleteBoard.js

import api from '../../../services/api';
import { toast } from 'react-toastify';

export const deleteBoard = async (
    boardId,
    boards,
    setBoards,
    selectedBoard,
    setSelectedBoard,
    setSelectedBackground,
    onSuccess // Aggiunto parametro di callback
) => {
    const boardToDelete = boards.find((board) => board.id === boardId);
    if (!boardToDelete) return;

    // Mostra il messaggio di conferma prima di procedere
    const userConfirmed = window.confirm(`Sei sicuro di voler eliminare la lavagnetta "${boardToDelete.name}"?`);
    if (!userConfirmed) return;

    if (boardToDelete.is_default) {
        toast.error('La lavagnetta di default non può essere eliminata.');
        return;
    }

    try {
        await api.delete(`/auth/boards/${boardId}`);
        setBoards((prevBoards) => prevBoards.filter((board) => board.id !== boardId));

        // Verifica se la lavagnetta selezionata è stata eliminata
        if (selectedBoard && selectedBoard.id === boardId) {
            setSelectedBoard(null);
            setSelectedBackground('blackboard.jpg');
            toast.error('Nessuna lavagnetta selezionata.');
        }

        toast.success(`Lavagnetta "${boardToDelete.name}" eliminata con successo.`);

        // Verifica la funzione di callback onSuccess solo se ancora definita
        if (typeof onSuccess === 'function') onSuccess();
    } catch (error) {
        console.error("Errore nell'eliminazione della lavagnetta:", error);
        toast.error("Errore nell'eliminazione della lavagnetta. Riprova più tardi.");
    }
};
