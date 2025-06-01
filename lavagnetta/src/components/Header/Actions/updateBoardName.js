// src/components/Header/actions/updateBoardName.js

import api from '../../../services/api';
import { toast } from 'react-toastify';

export const updateBoardName = async (
    boardId,
    editedBoardName,
    selectedBackground,
    boards,
    setBoards,
    selectedBoard,
    setSelectedBoard,
    setEditingBoardId,
    setEditedBoardName
) => {
    if (editedBoardName.trim() === '') {
        toast.error('Il nome della lavagnetta non può essere vuoto.');
        return;
    }
    try {
        const response = await api.put(`/auth/boards/${boardId}`, {
            name: editedBoardName,
            background: selectedBackground,
        });
        setBoards(
            boards.map((board) =>
                board.id === boardId ? { ...board, name: response.data.name } : board
            )
        );
        if (selectedBoard && selectedBoard.id === boardId) {
            setSelectedBoard({ ...selectedBoard, name: response.data.name });
        }
        setEditingBoardId(null);
        setEditedBoardName('');
        toast.success('Nome della lavagnetta aggiornato con successo.');
    } catch (error) {
        console.error('Errore nell\'aggiornamento della lavagnetta:', error);
        toast.error('Errore nell\'aggiornamento della lavagnetta. Riprova più tardi.');
    }
};
