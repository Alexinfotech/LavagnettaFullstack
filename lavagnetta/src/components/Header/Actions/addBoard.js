// src/components/Header/actions/addBoard.js

import api from '../../../services/api';
import { toast } from 'react-toastify';

export const addBoard = async (
    newBoardName,
    selectedBackground,
    boards,
    setBoards,
    setNewBoardName
) => {
    if (newBoardName.trim() === '') {
        toast.error('Il nome della lavagnetta non può essere vuoto.');
        return;
    }
    try {
        const response = await api.post(`/auth/boards`, {
            name: newBoardName,
            background: selectedBackground,
        });
        setBoards([...boards, response.data]);
        setNewBoardName('');
        toast.success('Lavagnetta aggiunta con successo.');
    } catch (error) {
        console.error('Errore nella creazione della lavagnetta:', error);
        toast.error('Errore nella creazione della lavagnetta. Riprova più tardi.');
    }
};
