// src/components/Board/actions/fetchItems.js

import api from '../../../services/api';
import { toast } from 'react-toastify';

/**
 * Recupera gli elementi della lavagnetta dal backend.
 * @param {Object} selectedBoard - Lavagnetta selezionata.
 * @param {Function} setItems - Funzione per impostare gli elementi nello stato.
 * @param {Function} setIsLoading - Funzione per gestire lo stato di caricamento.
 */
export const fetchItems = async (selectedBoard, setItems, setIsLoading) => {
    try {
        setIsLoading(true);
        const response = await api.get(`/auth/boards/${selectedBoard.id}/products`);

        // Verifica che la risposta abbia i prodotti
        if (response.data) {
            setItems(response.data);
        } else {
            setItems([]);
            toast.warning('Nessun prodotto trovato.');
        }
    } catch (error) {
        console.error('Errore nel recuperare gli elementi della lavagnetta:', error);
        toast.error('Errore nel recuperare gli elementi della lavagnetta.');
    } finally {
        setIsLoading(false);
    }
};
