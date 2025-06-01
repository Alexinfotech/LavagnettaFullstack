// frontend/src/services/groupService.js
import api from './api';

const groupService = {
    getGroups: async () => {
        try {
            console.log("[groupService] getGroups: Chiamata API /auth/groups");
            const response = await api.get('/auth/groups');
            console.log("[groupService] getGroups: Risposta ricevuta");
            return response.data;
        } catch (error) {
            console.error("[groupService] Errore getGroups:", error);
            throw error;
        }
    },

    createGroup: async (groupData) => {
        try {
            console.log("[groupService] createGroup: Chiamata API POST /auth/groups con dati:", groupData);
            const response = await api.post("/auth/groups", groupData);
            console.log("[groupService] createGroup: Risposta ricevuta:", response.data);
            return response.data;
        } catch (error) {
            console.error("[groupService] Errore createGroup:", error);
            throw error;
        }
    },

    getGroupById: async (groupId) => {
        // *** AGGIUNTO LOG DETTAGLIATO E CONTROLLO ID ***
        console.log(`[groupService] getGroupById: Chiamata API /auth/groups/${groupId}`);
        if (!groupId || isNaN(parseInt(groupId))) {
            const errorMsg = `[groupService] getGroupById: Tentativo di chiamata con groupId non valido: ${groupId}`;
            console.error(errorMsg);
            throw new Error(errorMsg); // Lancia un errore per bloccare la chiamata API errata
        }
        // *** FINE AGGIUNTA ***
        try {
            const response = await api.get(`/auth/groups/${groupId}`);
            console.log(`[groupService] getGroupById(${groupId}): Risposta ricevuta`);
            return response.data;
        } catch (error) {
            console.error(`[groupService] Errore getGroupById(${groupId}):`, error);
            throw error;
        }
    },

    getGroupMembers: async (groupId) => {
        // *** AGGIUNTO LOG DETTAGLIATO E CONTROLLO ID ***
        console.log(`[groupService] getGroupMembers: Chiamata API /auth/groups/${groupId}/members`);
        if (!groupId || isNaN(parseInt(groupId))) {
            const errorMsg = `[groupService] getGroupMembers: Tentativo di chiamata con groupId non valido: ${groupId}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        // *** FINE AGGIUNTA ***
        try {
            const response = await api.get(`/auth/groups/${groupId}/members`);
            console.log(`[groupService] getGroupMembers(${groupId}): Risposta ricevuta`);
            return response.data;
        } catch (error) {
            console.error(`[groupService] Errore getGroupMembers(${groupId}):`, error);
            throw error;
        }
    },

    getGroupBoards: async (groupId, userId) => { // Aggiunto userId se serve per log o altro
        // *** AGGIUNTO LOG DETTAGLIATO E CONTROLLO ID ***
        console.log(`[groupService] getGroupBoards: Chiamata API /auth/groups/${groupId}/boards (User: ${userId})`);
        if (!groupId || isNaN(parseInt(groupId))) {
            const errorMsg = `[groupService] getGroupBoards: Tentativo di chiamata con groupId non valido: ${groupId}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        // *** FINE AGGIUNTA ***
        try {
            // La rotta ora restituisce direttamente l'array di boards con prodotti
            const response = await api.get(`/auth/groups/${groupId}/boards`);
            console.log(`[groupService] getGroupBoards(${groupId}): Risposta ricevuta`);
            // return response.data.boards; // Vecchio formato
            return response.data; // Nuovo formato: restituisce direttamente l'array di lavagne
        } catch (error) {
            console.error(`[groupService] Errore getGroupBoards(${groupId}):`, error);
            throw error;
        }
    },

    // Funzione per ottenere UNA specifica lavagna di gruppo con prodotti
    // Nota: Questa funzione è ora gestita direttamente nel GroupBoardView chiamando
    // l'endpoint specifico `/auth/groups/:groupId/boards/:boardId`, quindi potremmo
    // non aver bisogno di una funzione dedicata qui nel service, a meno che non sia
    // usata altrove. Per ora la commentiamo o rimuoviamo per evitare confusione.
    /*
    getGroupBoardWithProducts: async (groupId, boardId) => {
        console.log(`[groupService] getGroupBoardWithProducts: Chiamata API /auth/groups/${groupId}/boards/${boardId}`);
         if (!groupId || isNaN(parseInt(groupId)) || !boardId || isNaN(parseInt(boardId))) {
             const errorMsg = `[groupService] getGroupBoardWithProducts: Tentativo con ID non validi: G:${groupId}, B:${boardId}`;
             console.error(errorMsg);
             throw new Error(errorMsg);
         }
        try {
            const response = await api.get(`/auth/groups/${groupId}/boards/${boardId}`);
            console.log(`[groupService] getGroupBoardWithProducts(${groupId}, ${boardId}): Risposta ricevuta`);
            return response.data; // L'endpoint ora restituisce direttamente l'oggetto board con i prodotti
        } catch (error) {
            console.error(`[groupService] Errore getGroupBoardWithProducts(G:${groupId}, B:${boardId}):`, error);
            throw error;
        }
    },
    */

    updateMemberRole: async (groupId, userId, newRole) => { /* ... come prima ... */ },
    removeMember: async (groupId, userId) => { /* ... come prima ... */ },
    inviteMembers: async (groupId, members) => { /* ... come prima ... */ },
    createBoard: async (groupId, boardData) => { /* ... come prima ... */ },
    deleteBoard: async (groupId, boardId) => { /* ... come prima ... */ },
};

export default groupService;