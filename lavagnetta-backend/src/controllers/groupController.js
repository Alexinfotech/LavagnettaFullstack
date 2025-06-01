// backend/controllers/groupController.js
const { validationResult } = require('express-validator');
const groupService = require('../services/groupService');
const userBoardSettingsService = require('../services/userBoardSettingsService');

const groupController = {

    // createGroup (Codice Originale v4)
    async createGroup(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, members } = req.body;
            // Assicura che members sia un array se non fornito
            const groupData = { name: name, userId: req.user.id, members: members || [] };
            const newGroup = await groupService.createGroup(groupData);
            res.status(201).json(newGroup); // Restituisce il gruppo creato dal service
        } catch (error) {
            console.error("[Ctrl-Group] Errore creazione gruppo:", error);
            res.status(500).json({ message: error.message || "Errore server creazione gruppo" });
        }
    },

    // getUserGroups (Codice Originale v4)
    async getUserGroups(req, res) {
        try {
            const groups = await groupService.getUserGroups(req.user.id);
            res.status(200).json(groups);
        } catch (error) {
            console.error("[Ctrl-Group] Errore recupero gruppi utente:", error);
            res.status(500).json({ message: "Errore server recupero gruppi" });
        }
    },

    // getGroupById (Codice Originale v4)
    async getGroupById(req, res) {
        try {
            const groupId = parseInt(req.params.groupId);
            if (isNaN(groupId) || groupId <= 0) {
                return res.status(400).json({ message: "ID Gruppo non valido." });
            }
            const group = await groupService.getGroupById(groupId);
            if (!group) {
                return res.status(404).json({ message: "Gruppo non trovato" });
            }
            // Aggiunge il ruolo dell'utente corrente (dal middleware groupAuth)
            group.currentUserRole = req.userRole;
            res.status(200).json(group);
        } catch (error) {
            console.error(`[Ctrl-Group] Errore recupero gruppo ${req.params.groupId}:`, error);
            res.status(500).json({ message: "Errore server recupero gruppo" });
        }
    },

    // getGroupMembers (Codice Originale v4)
    async getGroupMembers(req, res) {
        try {
            const groupId = parseInt(req.params.groupId);
            if (isNaN(groupId) || groupId <= 0) {
                return res.status(400).json({ message: "ID Gruppo non valido." });
            }
            const members = await groupService.getGroupMembers(groupId);
            res.status(200).json(members);
        } catch (error) {
            console.error(`[Ctrl-Group] Errore recupero membri gruppo ${req.params.groupId}:`, error);
            res.status(500).json({ message: "Errore server recupero membri gruppo" });
        }
    },

    // getGroupBoards (Codice Originale v4)
    async getGroupBoards(req, res) {
        try {
            const groupId = parseInt(req.params.groupId);
            if (isNaN(groupId) || groupId <= 0) {
                return res.status(400).json({ message: "ID Gruppo non valido." });
            }
            const boards = await groupService.getGroupBoards(groupId, req.user.id);
            res.status(200).json(boards);
        } catch (error) {
            console.error(`[Ctrl-Group] Errore recupero lavagne gruppo ${req.params.groupId}:`, error);
            res.status(500).json({ message: error.message || "Errore server recupero lavagne gruppo" });
        }
    },

    // getGroupBoardById (Codice Originale v4)
    async getGroupBoardById(req, res) {
        const { groupId, boardId } = req.params;
        const userId = req.user.id;
        const userRole = req.userRole; // Impostato da middleware
        const numericGroupId = parseInt(groupId);
        const numericBoardId = parseInt(boardId);

        if (isNaN(numericGroupId) || numericGroupId <= 0 || isNaN(numericBoardId) || numericBoardId <= 0) {
            return res.status(400).json({ message: 'ID Gruppo o Lavagna non validi.' });
        }
        if (!userRole) {
            console.error(`[Ctrl-Group] getGroupBoardById: Ruolo utente mancante per User ${userId} in Group ${groupId}`);
            return res.status(500).json({ error: "Errore interno: ruolo utente non determinato." });
        }
        try {
            const boardData = await groupService.getGroupBoardWithProducts(userId, numericGroupId, numericBoardId, userRole);
            if (!boardData) {
                return res.status(404).json({ message: 'Lavagna non trovata o accesso negato.' });
            }
            const userBackground = await userBoardSettingsService.getUserBackgroundForBoard(userId, numericBoardId);
            boardData.userBackground = userBackground; // Aggiungi sfondo personalizzato
            res.status(200).json(boardData);
        } catch (error) {
            console.error(`[Ctrl-Group] Errore getGroupBoardById G:${groupId}, B:${boardId}:`, error);
            res.status(500).json({ error: error.message || 'Errore server nel recupero della lavagna di gruppo.' });
        }
    },

    // updateGroupBoard (Codice Originale v4)
    async updateGroupBoard(req, res) {
        const errors = validationResult(req); // Controllo validatori dalla rotta
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { groupId, boardId } = req.params;
        const { name, background } = req.body;
        const userId = req.user.id;
        const userRole = req.userRole;
        const numericGroupId = parseInt(groupId);
        const numericBoardId = parseInt(boardId);

        // Questo controllo ID è ridondante se i validatori param() funzionano, ma lo teniamo per sicurezza
        if (isNaN(numericGroupId) || numericGroupId <= 0 || isNaN(numericBoardId) || numericBoardId <= 0) {
            return res.status(400).json({ message: 'ID gruppo o lavagna non validi (controllo controller).' });
        }
        // Il validatore custom nella rotta controlla che almeno un campo sia fornito
        const fieldsToUpdate = {};
        if (name !== undefined) fieldsToUpdate.name = name;
        if (background !== undefined) fieldsToUpdate.background = background;
        // Non serve ricontrollare Object.keys(fieldsToUpdate).length === 0

        try {
            const updatedBoard = await groupService.updateGroupBoardDetails(userId, numericGroupId, numericBoardId, userRole, fieldsToUpdate);
            if (!updatedBoard) {
                // Se il service ritorna null (es. board non trovata)
                return res.status(404).json({ error: `Lavagna con ID ${numericBoardId} non trovata o aggiornamento fallito.` });
            }
            res.status(200).json(updatedBoard); // Restituisce i dettagli base aggiornati dal service
        } catch (error) {
            console.error(`[Ctrl-Group] Errore updateGroupBoard G:${groupId}, B:${boardId}:`, error);
            if (error.message.includes("Permesso negato")) { return res.status(403).json({ error: error.message }); }
            if (error.message.includes("non trovata") || error.message.includes("non appartenente")) { return res.status(404).json({ error: error.message }); }
            if (error.message.includes("non valido")) { return res.status(400).json({ error: error.message }); } // Es. nome vuoto dal service
            res.status(500).json({ error: error.message || 'Errore server durante aggiornamento lavagna di gruppo.' });
        }
    },

    // inviteMembers (Codice Originale v4)
    async inviteMembers(req, res) {
        const errors = validationResult(req); // Controlla validatori dalla rotta
        if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
        try {
            const groupId = parseInt(req.params.groupId); // Già validato
            const membersToInvite = req.body.members; // Già validato
            // console.log(`[Ctrl-Group] inviteMembers: Admin ${req.user.id} invita a Group ${groupId}`, membersToInvite); // Riduci log
            // Il permesso Admin è verificato dal middleware nella rotta
            await groupService.inviteMembers(groupId, membersToInvite, req.user.id);
            res.status(200).json({ message: "Operazione di invito completata." });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore inviteMembers G:${req.params.groupId}:`, error);
            if (error.message.includes("non sono registrate") || error.message.includes("Nessuna email valida fornita") || error.message.includes("non trovato")) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: error.message || "Errore server durante l'invio degli inviti." });
        }
    },

    // handleInvite (Codice Originale v4)
    async handleInvite(req, res) {
        const errors = validationResult(req); // Controlla validatori dalla rotta
        if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
        try {
            const { notificationId, accept } = req.body; // Già validati
            await groupService.handleInvite(req.user.id, notificationId, accept);
            res.status(200).json({ message: accept ? 'Invito accettato!' : 'Invito rifiutato.' });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore handleInvite (Notif ${req.body.notificationId}):`, error);
            if (error.message.includes("non trovata") || error.message.includes("non trovato") || error.message.includes("Invito al gruppo non trovato")) { return res.status(404).json({ message: error.message }); }
            if (error.message.includes("non può essere accettata") || error.message.includes("non appartenente")) { return res.status(403).json({ message: error.message }); }
            if (error.message.includes("corrotti") || error.message.includes("mancante") || error.message.includes("invalidi")) { return res.status(400).json({ message: error.message }); }
            res.status(500).json({ message: error.message || 'Errore server nella gestione dell\'invito.' });
        }
    },

    // updateMemberRole (Codice Originale v4)
    async updateMemberRole(req, res) {
        const errors = validationResult(req); // Controlla validatori dalla rotta
        if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
        try {
            const groupId = parseInt(req.params.groupId); // Validato
            const userIdToUpdate = parseInt(req.params.userId); // Validato
            const newRole = req.body.role; // Validato
            const actingUserId = req.user.id;
            // console.log(`[Ctrl-Group] updateMemberRole: Admin ${actingUserId} -> User ${userIdToUpdate} a ${newRole} in Group ${groupId}`); // Riduci log

            // Il check sul declassamento admin è gestito nel service ora
            await groupService.updateMemberRole(groupId, userIdToUpdate, newRole, actingUserId);
            res.status(200).json({ message: "Ruolo aggiornato con successo." });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore updateMemberRole G:${req.params.groupId}, U:${req.params.userId}:`, error);
            if (error.message.includes("Permesso negato") || error.message.includes("Non puoi modificare") || error.message.includes("creatore") || error.message.includes("non può essere modificato")) { return res.status(403).json({ message: error.message }); }
            if (error.message.includes("non trovato") || error.message.includes("invito pendente")) { return res.status(404).json({ message: error.message }); }
            if (error.message.includes("non valido")) { return res.status(400).json({ message: error.message }); }
            res.status(500).json({ message: error.message || "Errore server durante l'aggiornamento del ruolo." });
        }
    },

    // requestMemberRoleChange (Codice Originale v4)
    async requestMemberRoleChange(req, res) {
        const errors = validationResult(req); // Controlla validatori
        if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
        try {
            const groupId = parseInt(req.params.groupId); // Validato
            const targetUserId = parseInt(req.params.userId); // Validato
            const newRole = req.body.role; // Validato
            const actingAdminId = req.user.id;
            // Permesso Admin verificato da middleware
            await groupService.requestMemberRoleChange(groupId, targetUserId, newRole, actingAdminId);
            res.status(200).json({ message: "Richiesta di modifica ruolo inviata con successo all'utente." });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore requestMemberRoleChange G:${req.params.groupId}, TargetU:${req.params.userId}:`, error);
            if (error.message.includes("Permesso negato") || error.message.includes("Non puoi richiedere") || error.message.includes("non è attualmente un Amministratore")) { return res.status(403).json({ message: error.message }); }
            if (error.message.includes("non trovato")) { return res.status(404).json({ message: error.message }); }
            if (error.message.includes("non valido")) { return res.status(400).json({ message: error.message }); }
            res.status(500).json({ message: error.message || "Errore server durante la richiesta di modifica ruolo." });
        }
    },

    // removeMember (Codice Originale v4)
    async removeMember(req, res) {
        try {
            const groupId = parseInt(req.params.groupId); // Validato
            const memberIdToRemove = parseInt(req.params.userId); // Validato
            // Permesso Admin verificato da middleware
            await groupService.removeMember(groupId, memberIdToRemove, req.user.id);
            res.status(200).json({ message: "Membro rimosso." });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore removeMember G:${req.params.groupId}, U:${req.params.userId}:`, error);
            if (error.message.includes("Permesso negato") || error.message.includes("non può essere rimosso") || error.message.includes("Non puoi rimuovere")) { return res.status(403).json({ message: error.message }); }
            if (error.message.includes("non trovato")) { return res.status(404).json({ message: error.message }); }
            res.status(500).json({ message: error.message || "Errore server durante la rimozione del membro." });
        }
    },

    // transferAdminRole (Codice Originale v4)
    async transferAdminRole(req, res) {
        const errors = validationResult(req); // Controlla validatori
        if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
        try {
            const groupId = parseInt(req.params.groupId); // Validato
            const newAdminId = parseInt(req.body.newAdminId); // Validato
            // Permesso Admin verificato da middleware
            await groupService.transferAdminRole(groupId, req.user.id, newAdminId);
            res.status(200).json({ message: "Ruolo admin trasferito/aggiornato." });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore transferAdminRole G:${req.params.groupId}:`, error);
            if (error.message.includes("Permesso negato") || error.message.includes("Non puoi trasferire")) { return res.status(403).json({ message: error.message }); }
            if (error.message.includes("già un amministratore") || error.message.includes("non è un membro attivo") || error.message.includes("inconsistente")) { return res.status(400).json({ message: error.message }); }
            if (error.message.includes("non trovato")) { return res.status(404).json({ message: error.message }); }
            res.status(500).json({ message: error.message || "Errore server durante il trasferimento del ruolo admin." });
        }
    },

    // createGroupBoard (Codice Originale v4)
    async createGroupBoard(req, res) {
        const errors = validationResult(req); // Controlla validatori
        if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
        try {
            const groupId = parseInt(req.params.groupId); // Validato
            const { name, background } = req.body; // Validati (name required, background optional)
            // Permesso Admin/Level1 verificato nella rotta
            const newBoard = await groupService.createGroupBoard(groupId, req.user.id, name, background);
            res.status(201).json(newBoard);
        } catch (error) {
            console.error(`[Ctrl-Group] Errore createGroupBoard G:${req.params.groupId}:`, error);
            if (error.message.includes("Permesso negato")) { return res.status(403).json({ message: error.message }); }
            if (error.message.includes("fallita") || error.message.includes("non può essere vuoto")) { return res.status(400).json({ message: error.message }); }
            res.status(500).json({ message: error.message || "Errore server durante la creazione della lavagna di gruppo." });
        }
    },

    // deleteBoard (Codice Originale v4)
    async deleteBoard(req, res) {
        try {
            const groupId = parseInt(req.params.groupId); // Validato
            const boardId = parseInt(req.params.boardId); // Validato
            // Permesso Admin verificato da middleware
            await groupService.deleteBoard(groupId, boardId, req.user.id);
            res.status(200).json({ message: "Lavagnetta di gruppo eliminata." });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore deleteBoard G:${req.params.groupId}, B:${req.params.boardId}:`, error);
            if (error.message.includes("default") || error.message.includes("Permesso negato")) { return res.status(403).json({ message: error.message }); }
            if (error.message.includes("non trovata") || error.message.includes("Impossibile eliminare")) { return res.status(404).json({ message: error.message }); }
            res.status(500).json({ message: error.message || "Errore server durante l'eliminazione della lavagna di gruppo." });
        }
    },

    // deleteGroup (Codice Originale v4)
    async deleteGroup(req, res) {
        const groupId = parseInt(req.params.groupId); // Validato
        const userId = req.user.id;
        // Permesso Admin verificato da middleware
        try {
            await groupService.deleteGroup(groupId, userId);
            res.status(200).json({ message: 'Gruppo eliminato con successo.' });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore deleteGroup G:${groupId}:`, error);
            if (error.message.includes("Permesso negato") || error.message.includes("altri membri attivi") || error.message.includes("ultimo membro")) { return res.status(403).json({ error: error.message }); }
            if (error.message.includes("non trovato")) { return res.status(404).json({ error: error.message }); }
            if (error.message.includes("inconsistente")) { return res.status(500).json({ error: error.message }); }
            res.status(500).json({ error: 'Errore server eliminazione gruppo.' });
        }
    },

    // leaveGroup (Codice Originale v4)
    async leaveGroup(req, res) {
        try {
            const groupId = parseInt(req.params.groupId); // Validato
            const userId = req.user.id;
            // Permesso (essere membro) verificato da middleware
            await groupService.leaveGroup(groupId, userId);
            res.status(200).json({ message: "Hai abbandonato il gruppo con successo." });
        } catch (error) {
            console.error(`[Ctrl-Group] Errore leaveGroup (Group ${req.params.groupId}, User ${req.user.id}):`, error);
            if (error.message.includes("non trovato") || error.message.includes("non sei membro")) { return res.status(404).json({ error: error.message }); }
            if (error.message.includes("unico amministratore")) { return res.status(403).json({ error: error.message }); }
            res.status(500).json({ error: error.message || "Errore server durante l'abbandono del gruppo." });
        }
    },

    // requestGroupDeletion, confirmGroupDeletion (Mantenuti come stub)
    async requestGroupDeletion(req, res) { res.status(501).json({ message: 'Not Implemented Yet' }); },
    async confirmGroupDeletion(req, res) { res.status(501).json({ message: 'Not Implemented Yet' }); },


    // ---- NUOVO METODO per /status ----
    async getGroupBoardStatus(req, res) {
        const errors = validationResult(req); // Controlla errori validatore (ID e 'since')
        if (!errors.isEmpty()) {
            console.warn(`[Ctrl-Group Status] Errori di validazione:`, errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const groupId = req.params.groupId; // Già numero (da validatore rotta)
            const boardId = req.params.boardId; // Già numero (da validatore rotta)
            const sinceTimestamp = req.query.since; // Già numero (da validatore rotta)
            const userId = req.user.id;

            // console.log(`[Ctrl-Group Status] Richiesta status G:${groupId}, B:${boardId}, since:${sinceTimestamp} da User:${userId}`); // Riduci log

            // Chiama il servizio per ottenere lo stato
            const statusResult = await groupService.getGroupBoardStatus(userId, groupId, boardId, sinceTimestamp);

            // Imposta header per disabilitare caching
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.set('Surrogate-Control', 'no-store');

            // Invia la risposta
            res.status(200).json(statusResult); // Es: { hasUpdates: true }

        } catch (error) {
            console.error(`[Ctrl-Group Status] Errore G:${req.params.groupId}, B:${req.params.boardId}:`, error);
            // Gestione errori specifici lanciati dal service
            if (error.message.includes("non trovata") || error.message.includes("non appartenente") || error.message.includes("Accesso negato")) {
                // Maschera 403 come 404
                return res.status(404).json({ error: "Risorsa non trovata o accesso negato." });
            }
            // Altri errori (es. timestamp non valido dal service, se lo implementassimo lì)
            if (error.message.includes("Timestamp 'since'")) {
                return res.status(400).json({ error: error.message });
            }
            // Errore generico del server
            res.status(500).json({ error: 'Errore server nel controllare lo stato della lavagna/gruppo.' });
        }
    }
    // ---- FINE NUOVO METODO ----

};

module.exports = groupController;
//VERSIONE PER NOTIFICA AGGGIORNAMENTO
