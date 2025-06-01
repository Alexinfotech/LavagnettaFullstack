// backend/services/groupService.js
const pool = require("../config/db");
const notificationService = require("./notificationService"); // Verifica path!
const boardModel = require("../models/boardModel"); // Verifica path!

class GroupService {

    // Funzione helper per aggiornare updated_at del gruppo
    async _touchGroup(groupId, conn) {
        if (!conn) {
            console.error("[Service-Group] _touchGroup chiamato senza connessione DB attiva!");
            return;
        }
        try {
            const numericGroupId = parseInt(groupId);
            if (!numericGroupId || numericGroupId <= 0) {
                console.warn(`[Service-Group] _touchGroup: ID gruppo non valido: ${groupId}`);
                return;
            }
            const touchGroupQuery = 'UPDATE groups SET updated_at = NOW() WHERE id = ?';
            const [result] = await conn.execute(touchGroupQuery, [numericGroupId]);
            if (result.affectedRows > 0) {
                console.log(`[Service-Group] Toccato updated_at per Group ${numericGroupId}`);
            } else {
                console.warn(`[Service-Group] _touchGroup: Nessuna riga aggiornata per Group ${numericGroupId}. Il gruppo esiste?`);
            }
        } catch (touchError) {
            console.error(`[Service-Group] Errore (non bloccante) durante il touch del gruppo ${groupId}:`, touchError);
        }
    }

    // Funzione helper per ottenere il nome del gruppo
    async getGroupName(groupId, conn = null) {
        const connection = conn || pool;
        try {
            const [rows] = await connection.execute("SELECT name FROM groups WHERE id = ?", [groupId]);
            return rows[0]?.name || "";
        } catch (error) {
            console.error(`[Service-Group] Errore getGroupName ${groupId}:`, error);
            throw error;
        }
    }

    // Funzione helper per ottenere il ruolo
    async getUserRole(userId, groupId, conn = null) {
        const connection = conn || pool;
        try {
            const [rows] = await connection.execute(
                "SELECT role FROM group_members WHERE user_id = ? AND group_id = ? AND accepted_at IS NOT NULL",
                [userId, groupId]
            );
            return rows[0]?.role || null;
        } catch (error) {
            console.error(`[Service-Group] Errore getUserRole User ${userId} Group ${groupId}:`, error);
            throw error;
        }
    }

    // Funzione helper per verificare se admin
    async ensureIsAdmin(groupId, userId, conn = null) {
        const connection = conn || await pool.getConnection();
        let localConnection = !conn;
        try {
            const role = await this.getUserRole(userId, groupId, connection);
            if (role !== 'admin') {
                throw new Error("Permesso negato. Azione riservata agli amministratori.");
            }
        } catch (error) {
            if (!error.message.includes("Permesso negato")) {
                console.error(`[Service-Group] Errore in ensureIsAdmin (Group ${groupId}, User ${userId}):`, error);
            }
            throw error;
        } finally {
            if (localConnection && connection) connection.release();
        }
    }


    // --- Metodi Principali ---

    async createGroup(groupData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const { name, userId, members } = groupData;
            const trimmedName = name?.trim();
            if (!trimmedName) throw new Error("Il nome del gruppo è obbligatorio.");

            const [groupResult] = await connection.execute(
                'INSERT INTO groups (name, created_by, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
                [trimmedName, userId]
            );
            const groupId = groupResult.insertId;
            if (!groupId || groupId <= 0) throw new Error("Errore DB: Impossibile ottenere ID nuovo gruppo.");

            await connection.execute(
                'INSERT INTO group_members (group_id, user_id, role, accepted_at) VALUES (?, ?, ?, NOW())',
                [groupId, userId, 'admin']
            );

            const defaultBoard = await boardModel.createBoard(userId, 'Lavagna Principale', 'blackboard.jpg', groupId, true, connection);
            if (!defaultBoard) throw new Error("Creazione lavagna di default fallita.");

            if (members && members.length > 0) {
                await this.inviteMembers(groupId, members, userId, connection);
            }

            await connection.commit();

            const [newGroupData] = await connection.execute('SELECT * FROM groups WHERE id = ?', [groupId]);
            if (newGroupData.length === 0) throw new Error("Errore recupero gruppo dopo creazione.");
            return newGroupData[0];

        } catch (error) {
            if (connection) await connection.rollback();
            console.error("[Service-Group] Errore creazione gruppo:", error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    async inviteMembers(groupId, membersToInvite, inviterId, conn = null) {
        const connection = conn || await pool.getConnection();
        let localConnection = !conn;
        try {
            if (localConnection) await connection.beginTransaction();
            console.log(`[Service-Group] inviteMembers G:${groupId} da User:${inviterId}`, membersToInvite);
            if (!membersToInvite || membersToInvite.length === 0) throw new Error("Nessun membro fornito per l'invito.");

            const groupName = await this.getGroupName(groupId, connection);
            if (!groupName) throw new Error(`Gruppo ${groupId} non trovato.`);

            let inviterUsername = `Utente ID ${inviterId}`; let inviterEmail = null;
            try {
                const [inviterRows] = await connection.execute("SELECT username, email FROM users WHERE id = ?", [inviterId]);
                if (inviterRows.length > 0) { inviterUsername = inviterRows[0].username; inviterEmail = inviterRows[0].email; }
            } catch (userError) { console.warn(`[Service-Group] Impossibile trovare info per inviter ${inviterId}`, userError); }

            const report = { sent: 0, alreadyMember: 0, alreadyInvited: 0, notRegistered: [], selfInvite: [], otherErrors: [] };
            let groupWasTouched = false;

            const emailsToFind = [...new Set(membersToInvite.map(m => m.email?.trim()).filter(Boolean))];
            let userMap = new Map();
            if (emailsToFind.length > 0) {
                const placeholders = emailsToFind.map(() => '?').join(',');
                const [foundUsers] = await connection.execute(`SELECT id, email, username FROM users WHERE email IN (${placeholders})`, emailsToFind);
                foundUsers.forEach(u => userMap.set(u.email, { id: u.id, username: u.username }));
            }
            const notRegisteredEmails = emailsToFind.filter(email => !userMap.has(email));
            if (notRegisteredEmails.length > 0) { if (localConnection) await connection.rollback(); throw new Error(`Impossibile inviare. Utenti non registrati: ${notRegisteredEmails.join(', ')}`); }

            for (const memberInfo of membersToInvite) {
                const email = memberInfo.email?.trim(); const role = (memberInfo.role && ['level1', 'level2'].includes(memberInfo.role)) ? memberInfo.role : 'level2';
                if (!email) { report.otherErrors.push("Voce invito senza email."); continue; }
                if (email === inviterEmail) { report.selfInvite.push(email); continue; }
                const invitedUser = userMap.get(email);
                if (!invitedUser) { console.error(`[Service-Group] ERRORE LOGICO: Utente ${email} non trovato.`); continue; }
                const invitedUserId = invitedUser.id;
                let existingMember = null;
                try { const [rows] = await connection.execute("SELECT id, accepted_at FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, invitedUserId]); existingMember = rows[0]; }
                catch (checkError) { console.error(`[Service-Group] Errore DB controllo membro ${email}:`, checkError); report.otherErrors.push(`${email} (errore controllo)`); continue; }

                if (existingMember) { if (existingMember.accepted_at) report.alreadyMember++; else report.alreadyInvited++; }
                else {
                    const notificationData = { type: "GROUP_INVITE", groupId: parseInt(groupId), groupName, invitedBy: inviterUsername, role: role };
                    const notificationMessage = `${inviterUsername} ti ha invitato a unirti al gruppo "${groupName}" come ${role}.`;
                    let notificationId = null;
                    try { notificationId = await notificationService.createNotification(invitedUserId, notificationMessage, notificationData, connection); if (typeof notificationId !== 'number' || notificationId <= 0) throw new Error(`Fallita creazione notifica per ${email}, ID non valido: ${notificationId}`); }
                    catch (notifError) { console.error(`[Service-Group] Errore creazione notifica per ${email}:`, notifError); report.otherErrors.push(`${email} (errore notifica)`); continue; }
                    const insertParams = [groupId, invitedUserId, role, notificationId];
                    console.log('[Service-Group] Tentativo INSERT group_members con parametri (senza invited_by):', insertParams);
                    if (insertParams.some(p => typeof p === 'undefined')) { console.error('[Service-Group] ERRORE: Parametro UNDEFINED rilevato prima di INSERT!', insertParams); report.otherErrors.push(`${email} (parametro mancante)`); continue; }
                    try { await connection.execute("INSERT INTO group_members (group_id, user_id, role, invited_at, notification_id, accepted_at) VALUES (?, ?, ?, NOW(), ?, NULL)", insertParams); report.sent++; groupWasTouched = true; }
                    catch (insertError) { console.error(`[Service-Group] Errore INSERT group_members per ${email}:`, insertError); report.otherErrors.push(`${email} (errore inserimento DB)`); }
                }
            }
            if (report.otherErrors.length > 0) { if (localConnection) await connection.rollback(); throw new Error(`Si sono verificati errori durante l'invito: ${report.otherErrors.join('; ')}`); }
            if (groupWasTouched) { await this._touchGroup(groupId, connection); }
            if (localConnection) await connection.commit();
            console.log(`[Service-Group] Risultati Inviti Gruppo ${groupId}:`, report);
            return report;
        } catch (error) {
            if (localConnection && connection) await connection.rollback();
            console.error("[Service-Group] Errore DENTRO inviteMembers:", error);
            throw error;
        } finally {
            if (localConnection && connection) connection.release();
        }
    }


    async getUserGroups(userId) {
        try {
            const [results] = await pool.execute(
                `SELECT g.id, g.name, g.created_by, g.created_at, g.updated_at, gm.role,
                        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND accepted_at IS NOT NULL) AS memberCount,
                        (SELECT COUNT(*) FROM boards WHERE group_id = g.id) AS boardCount
                 FROM groups g
                 INNER JOIN group_members gm ON g.id = gm.group_id
                 WHERE gm.user_id = ? AND gm.accepted_at IS NOT NULL
                 ORDER BY g.updated_at DESC, g.name ASC`, [userId]
            );
            return results;
        } catch (error) {
            console.error(`[Service-Group] Errore getUserGroups per User ${userId}:`, error);
            throw error;
        }
    }

    async getGroupById(groupId) {
        try {
            const [rows] = await pool.execute(
                `SELECT g.*, u.username AS creatorUsername,
                       (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND accepted_at IS NOT NULL) AS memberCount,
                       (SELECT COUNT(*) FROM boards WHERE group_id = g.id) AS boardCount
                FROM groups g
                LEFT JOIN users u ON g.created_by = u.id
                WHERE g.id = ?`, [groupId]
            );
            if (rows.length === 0) return null;
            return rows[0];
        } catch (error) {
            console.error(`[Service-Group] Errore getGroupById ${groupId}:`, error);
            throw error;
        }
    }

    async getGroupMembers(groupId) {
        try {
            const [members] = await pool.execute(
                `SELECT u.id, u.username, u.email, gm.role, gm.accepted_at
                 FROM users u
                 INNER JOIN group_members gm ON u.id = gm.user_id
                 WHERE gm.group_id = ? AND gm.accepted_at IS NOT NULL
                 ORDER BY gm.role ASC, u.username ASC`, [groupId]
            );
            return members;
        } catch (error) {
            console.error(`[Service-Group] Errore getGroupMembers ${groupId}:`, error);
            throw error;
        }
    }

    // **** MODIFICA QUI ****
    async getGroupBoards(groupId, userId) {
        try {
            const role = await this.getUserRole(userId, groupId);
            if (!role) {
                console.warn(`[Service-Group] getGroupBoards: Tentativo accesso da User ${userId} non membro a Group ${groupId}. Restituisco array vuoto.`);
                return [];
            }

            // Recupera le lavagne
            const [boards] = await pool.execute(
                `SELECT b.id, b.user_id, b.name, b.background, b.is_default,
                         b.group_id, b.is_group_default, b.created_at, b.updated_at
                  FROM boards b
                  WHERE b.group_id = ?
                  ORDER BY b.is_group_default DESC, b.name ASC`, [groupId]
            );

            if (boards.length === 0) return []; // Se non ci sono lavagne, non c'è nulla da fare

            const boardIds = boards.map(b => b.id);
            const placeholders = boardIds.map(() => '?').join(','); // Placeholders per IN clause

            let products = [];
            let userBackgrounds = new Map();

            // Recupera TUTTI i prodotti per TUTTE le lavagne del gruppo IN UNA SOLA QUERY, includendo lastModifiedByUsername
            const productQuery = `
                SELECT
                    p.id, p.board_id, p.name, p.is_purchased, p.created_at, p.updated_at, p.created_by, p.last_modified_by,
                    u_mod.username AS lastModifiedByUsername
                FROM products p
                LEFT JOIN users u_mod ON p.last_modified_by = u_mod.id
                WHERE p.board_id IN (${placeholders})
                ORDER BY p.board_id, p.created_at ASC
            `;
            [products] = await pool.execute(productQuery, boardIds);
            console.log(`[Service-Group] getGroupBoards: Recuperati ${products.length} prodotti per ${boardIds.length} lavagne.`); // Log per debug

            // Recupera gli sfondi personalizzati dell'utente per queste lavagne
            const settingsQuery = `SELECT board_id, background FROM user_board_settings WHERE user_id = ? AND board_id IN (${placeholders})`;
            try {
                const [settingsRows] = await pool.execute(settingsQuery, [userId, ...boardIds]);
                settingsRows.forEach(setting => userBackgrounds.set(setting.board_id, setting.background));
            } catch (settingsError) { console.error(`[Service-Group] Errore recupero sfondi personalizzati gruppo (ignoro):`, settingsError); }


            // Assembla l'output finale: mappa ogni lavagna e aggiungi i suoi prodotti (con username) e sfondo utente
            const finalBoards = boards.map(board => {
                const userBg = userBackgrounds.get(board.id) || null;
                // Filtra i prodotti per la lavagna corrente e converte is_purchased
                const boardProducts = products
                    .filter(p => p.board_id === board.id)
                    .map(p => ({
                        ...p, // Include già lastModifiedByUsername dal DB
                        is_purchased: !!p.is_purchased
                    }));
                return {
                    ...board,
                    is_default: !!board.is_default, // Assicura booleano
                    is_group_default: !!board.is_group_default, // Assicura booleano
                    userBackground: userBg,
                    products: boardProducts // Array di prodotti per questa lavagna
                };
            });

            // Log di controllo per la prima lavagna con prodotti (se esiste)
            // const firstBoardWithProducts = finalBoards.find(fb => fb.products.length > 0);
            // if (firstBoardWithProducts) {
            //      console.log("[Service-Group] getGroupBoards - Esempio prodotto nella prima lavagna:", firstBoardWithProducts.products[0]);
            // }


            return finalBoards;
        } catch (error) {
            console.error(`[Service-Group] Errore getGroupBoards ${groupId} for User ${userId}:`, error);
            return []; // Restituisci array vuoto in caso di errore grave
        }
    }
    // **** FINE MODIFICA getGroupBoards ****


    async getGroupBoardWithProducts(userId, groupId, boardId, userRole) {
        try {
            const [boardRows] = await pool.execute('SELECT * FROM boards WHERE id = ? AND group_id = ?', [boardId, groupId]);
            if (boardRows.length === 0) { return null; }
            const board = boardRows[0];
            board.is_default = !!board.is_default; board.is_group_default = !!board.is_group_default;

            // *** CORREZIONE QUERY PRODOTTI ANCHE QUI ***
            const productQuery = `
                SELECT
                    p.id, p.board_id, p.name, p.is_purchased, p.created_at, p.updated_at, p.created_by, p.last_modified_by,
                    u_mod.username AS lastModifiedByUsername
                FROM products p
                LEFT JOIN users u_mod ON p.last_modified_by = u_mod.id
                WHERE p.board_id = ?
                ORDER BY p.created_at ASC
            `;
            const [products] = await pool.execute(productQuery, [boardId]);
            // *** FINE CORREZIONE QUERY PRODOTTI ***

            // Aggiunge userRole ai dati della lavagna e mappa i prodotti
            return {
                ...board,
                products: products.map(p => ({ ...p, is_purchased: !!p.is_purchased })), // Mantiene lastModifiedByUsername
                userRole: userRole
            };
        } catch (error) {
            console.error(`[Service-Group] Errore getGroupBoardWithProducts (Board ${boardId}, Group ${groupId}):`, error);
            throw error;
        }
    }


    async updateGroupBoardDetails(userId, groupId, boardId, userRole, fieldsToUpdate) {
        const validFields = {};
        if (fieldsToUpdate.name !== undefined) {
            const trimmedName = fieldsToUpdate.name.trim();
            if (!trimmedName) throw new Error("Il nome della lavagna non può essere vuoto se fornito.");
            validFields.name = trimmedName;
        }
        if (fieldsToUpdate.background !== undefined) {
            validFields.background = fieldsToUpdate.background;
        }
        if (Object.keys(validFields).length === 0) throw new Error("Nessun campo valido fornito per l'aggiornamento (name o background).");

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const boardDetails = await boardModel.getBoardDetails(boardId, conn);
            if (!boardDetails || boardDetails.group_id !== groupId) throw new Error(`Lavagna ${boardId} non trovata o non appartenente al gruppo ${groupId}.`);

            if (userRole !== 'admin') {
                throw new Error("Permesso negato: solo gli Amministratori possono modificare i dettagli delle lavagne di gruppo.");
            }

            const updatedBoardDetails = await boardModel.updateGroupBoardDetails(boardId, validFields, conn);
            if (!updatedBoardDetails) throw new Error(`Impossibile aggiornare la lavagna ${boardId}.`);

            await this._touchGroup(groupId, conn);
            await conn.commit();
            return updatedBoardDetails;
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] Errore in updateGroupBoardDetails (Board ${boardId}, Group ${groupId}):`, error);
            throw error;
        } finally { if (conn) conn.release(); }
    }

    async updateMemberRole(groupId, userIdToUpdate, newRole, actingUserId, conn = null) {
        if (!['admin', 'level1', 'level2'].includes(newRole)) throw new Error("Ruolo specificato non valido.");
        const connection = conn || await pool.getConnection();
        const isLocalConnection = !conn;
        try {
            if (isLocalConnection) await connection.beginTransaction();
            if (actingUserId) { await this.ensureIsAdmin(groupId, actingUserId, connection); }

            const groupDetails = await this.getGroupById(groupId);
            if (!groupDetails) throw new Error(`Gruppo ${groupId} non trovato.`);
            if (userIdToUpdate === groupDetails.created_by) throw new Error("Non puoi modificare il ruolo del creatore del gruppo.");
            if (actingUserId && userIdToUpdate === actingUserId) throw new Error("Non puoi modificare il tuo ruolo tramite questa funzione.");

            const [result] = await connection.execute("UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ? AND accepted_at IS NOT NULL", [newRole, groupId, userIdToUpdate]);
            if (result.affectedRows === 0) {
                const [checkMember] = await connection.execute("SELECT id, accepted_at FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userIdToUpdate]);
                if (checkMember.length > 0 && checkMember[0].accepted_at === null) throw new Error(`Impossibile modificare il ruolo: l'utente ${userIdToUpdate} ha un invito pendente.`);
                else throw new Error(`Membro con ID ${userIdToUpdate} non trovato o non attivo nel gruppo ${groupId}.`);
            }
            await this._touchGroup(groupId, connection);
            if (isLocalConnection) await connection.commit();
            console.log(`[Service-Group] Ruolo User ${userIdToUpdate} aggiornato a ${newRole} in Group ${groupId}.`);
        } catch (error) {
            if (isLocalConnection && connection) await connection.rollback();
            console.error(`[Service-Group] Errore in updateMemberRole (Group ${groupId}, User ${userIdToUpdate}):`, error);
            throw error;
        } finally {
            if (isLocalConnection && connection) connection.release();
        }
    }

    async requestMemberRoleChange(groupId, targetUserId, newRole, actingAdminId) {
        if (!['level1', 'level2'].includes(newRole)) throw new Error("Ruolo richiesto non valido per il declassamento (solo level1 o level2).");
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await this.ensureIsAdmin(groupId, actingAdminId, conn);
            if (targetUserId === actingAdminId) throw new Error("Non puoi richiedere un cambio del tuo stesso ruolo.");
            const targetUserRole = await this.getUserRole(targetUserId, groupId, conn);
            if (targetUserRole !== 'admin') throw new Error(`L'utente target (ID: ${targetUserId}) non è attualmente un Amministratore in questo gruppo.`);

            const groupName = await this.getGroupName(groupId, conn);
            const [adminRows] = await conn.execute("SELECT username FROM users WHERE id = ?", [actingAdminId]);
            const actingAdminUsername = adminRows[0]?.username || `Admin (ID: ${actingAdminId})`;
            const newRoleLabel = newRole === 'level1' ? 'Editor' : 'Contributor';
            const message = `${actingAdminUsername} ha richiesto di modificare il tuo ruolo in "${newRoleLabel}" nel gruppo "${groupName}". Accetti questa modifica?`;
            const data = { type: "ROLE_CHANGE_REQUEST", groupId: parseInt(groupId), groupName, targetUserId: parseInt(targetUserId), newRole, requestedByUserId: actingAdminId, requestedByUsername: actingAdminUsername };

            await notificationService.createNotification(targetUserId, message, data, conn);
            await conn.commit();
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] Errore in requestMemberRoleChange (Group ${groupId}, TargetUser ${targetUserId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    async removeMember(groupId, memberIdToRemove, actingUserId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await this.ensureIsAdmin(groupId, actingUserId, conn);
            const groupDetails = await this.getGroupById(groupId);
            if (!groupDetails) throw new Error(`Gruppo ${groupId} non trovato.`);
            if (memberIdToRemove === actingUserId) throw new Error("Non puoi rimuovere te stesso dal gruppo.");
            if (memberIdToRemove === groupDetails.created_by) throw new Error("Non puoi rimuovere il creatore del gruppo.");

            const [result] = await conn.execute("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, memberIdToRemove]);
            if (result.affectedRows === 0) throw new Error(`Membro con ID ${memberIdToRemove} non trovato nel gruppo ${groupId}.`);
            await this._touchGroup(groupId, conn);
            await conn.commit();
            console.log(`[Service-Group] Membro ${memberIdToRemove} rimosso da Gruppo ${groupId}.`);
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] Errore in removeMember (Group ${groupId}, User ${memberIdToRemove}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    async transferAdminRole(groupId, actingUserId, newAdminId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await this.ensureIsAdmin(groupId, actingUserId, conn);
            if (actingUserId === newAdminId) throw new Error("Non puoi trasferire il ruolo di amministratore a te stesso.");
            const [recipient] = await conn.execute("SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND accepted_at IS NOT NULL", [groupId, newAdminId]);
            if (recipient.length === 0) throw new Error(`L'utente ${newAdminId} non è un membro attivo del gruppo ${groupId}.`);
            if (recipient[0].role === 'admin') throw new Error(`L'utente ${newAdminId} è già un amministratore.`);

            const [admins] = await conn.execute("SELECT user_id FROM group_members WHERE group_id = ? AND role = 'admin' AND accepted_at IS NOT NULL", [groupId]);
            const adminCount = admins.length;

            if (adminCount > 1) {
                await conn.execute("UPDATE group_members SET role = 'admin' WHERE group_id = ? AND user_id = ?", [groupId, newAdminId]);
            } else if (adminCount === 1 && admins[0].user_id === actingUserId) {
                await conn.execute("UPDATE group_members SET role = 'admin' WHERE group_id = ? AND user_id = ?", [groupId, newAdminId]);
                await conn.execute("UPDATE group_members SET role = 'level1' WHERE group_id = ? AND user_id = ?", [groupId, actingUserId]);
            } else {
                console.error(`[Service-Group] transferAdminRole: Stato admin inconsistente G:${groupId}, Cnt:${adminCount}, Acting:${actingUserId}, Admins:${JSON.stringify(admins)}`);
                throw new Error("Impossibile trasferire il ruolo a causa di uno stato amministratore inconsistente.");
            }
            await this._touchGroup(groupId, conn);
            await conn.commit();
            console.log(`[Service-Group] Ruolo admin trasferito a User ${newAdminId} in Gruppo ${groupId}.`);
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] Errore in transferAdminRole (Group ${groupId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    async createGroupBoard(groupId, userId, name, background) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const userRole = await this.getUserRole(userId, groupId, conn);
            if (!['admin', 'level1'].includes(userRole)) {
                throw new Error("Permesso negato: solo Amministratori o Editor possono creare lavagne.");
            }
            const trimmedName = name?.trim();
            if (!trimmedName) throw new Error("Il nome della lavagna non può essere vuoto.");
            const board = await boardModel.createBoard(userId, trimmedName, background || 'blackboard.jpg', groupId, false, conn);
            if (!board) throw new Error("Creazione lavagna fallita.");
            await this._touchGroup(groupId, conn);
            await conn.commit();
            console.log(`[Service-Group] Lavagna "${trimmedName}" (ID: ${board.id}) creata in Gruppo ${groupId}.`);
            return board;
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] Errore createGroupBoard (Group ${groupId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    async deleteBoard(groupId, boardId, actingUserId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await this.ensureIsAdmin(groupId, actingUserId, conn);
            const boardDetails = await boardModel.getBoardDetails(boardId, conn);
            if (!boardDetails || boardDetails.group_id !== groupId) throw new Error(`Lavagna ${boardId} non trovata o non appartenente al gruppo ${groupId}.`);
            if (!!boardDetails.is_group_default) {
                throw new Error("La lavagna di default del gruppo non può essere eliminata.");
            }
            const deleted = await boardModel.deleteGroupBoard(boardId, conn);
            if (!deleted) throw new Error(`Impossibile eliminare la lavagna ${boardId}.`);
            await this._touchGroup(groupId, conn);
            await conn.commit();
            console.log(`[Service-Group] Lavagna ${boardId} eliminata da Gruppo ${groupId}.`);
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] Errore in deleteBoard (Board ${boardId}, Group ${groupId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    async deleteGroup(groupId, actingUserId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await this.ensureIsAdmin(groupId, actingUserId, conn);
            const [members] = await conn.execute("SELECT user_id FROM group_members WHERE group_id = ? AND accepted_at IS NOT NULL", [groupId]);
            if (members.length > 1) {
                throw new Error("Impossibile eliminare il gruppo: ci sono ancora altri membri attivi. Rimuovili prima.");
            }
            if (members.length === 1 && members[0].user_id !== actingUserId) {
                throw new Error("Errore interno: stato membri inconsistente durante l'eliminazione.");
            }
            console.warn(`[Service-Group] deleteGroup: Procedo con eliminazione gruppo ${groupId}.`);
            const [result] = await conn.execute("DELETE FROM groups WHERE id = ?", [groupId]);
            if (result.affectedRows === 0) throw new Error(`Gruppo ${groupId} non trovato durante l'eliminazione.`);
            await conn.commit();
            console.log(`[Service-Group] Gruppo ${groupId} eliminato con successo da User ${actingUserId}.`);
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] deleteGroup Error (Group ${groupId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    async leaveGroup(groupId, userId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const userRole = await this.getUserRole(userId, groupId, conn);
            if (!userRole) throw new Error(`Utente ${userId} non trovato o non membro attivo del gruppo ${groupId}.`);
            const [admins] = await conn.execute("SELECT user_id FROM group_members WHERE group_id = ? AND role = 'admin' AND accepted_at IS NOT NULL", [groupId]);
            const isOnlyAdmin = userRole === 'admin' && admins.length === 1 && admins[0].user_id === userId;
            if (isOnlyAdmin) throw new Error("Non puoi abbandonare: sei l'unico amministratore. Promuovi un altro membro o elimina il gruppo.");

            const [result] = await conn.execute("DELETE FROM group_members WHERE group_id = ? AND user_id = ?", [groupId, userId]);
            if (result.affectedRows > 0) {
                await this._touchGroup(groupId, conn);
                console.log(`[Service-Group] User ${userId} ha abbandonato Group ${groupId}.`);
                const [remaining] = await conn.execute("SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND accepted_at IS NOT NULL", [groupId]);
                if (remaining[0].count === 0) {
                    console.warn(`[Service-Group] Gruppo ${groupId} è ora vuoto dopo l'abbandono dell'utente ${userId}. Il gruppo non verrà eliminato automaticamente.`);
                }
            } else { console.warn(`[Service-Group] leaveGroup: affectedRows = 0 per User ${userId} in Group ${groupId}.`); }
            await conn.commit();
        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-Group] Errore in leaveGroup (Group ${groupId}, User ${userId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    async requestGroupDeletion(groupId, userId) { throw new Error("Not Implemented Yet"); }
    async confirmGroupDeletion(groupId, userId) { throw new Error("Not Implemented Yet"); }

    // --- METODO getGroupBoardStatus MODIFICATO PER RESTITUIRE TIMESTAMP ---
    async getGroupBoardStatus(userId, groupId, boardId, sinceTimestamp) {
        const numericGId = parseInt(groupId);
        const numericBId = parseInt(boardId);
        const clientTimestamp = Number(sinceTimestamp);
        if (isNaN(numericGId) || numericGId <= 0 || isNaN(numericBId) || numericBId <= 0 || isNaN(clientTimestamp) || clientTimestamp <= 0) {
            console.error(`[Service-Group Status] Parametri non validi: GID=${groupId}, BID=${boardId}, Since=${sinceTimestamp}`);
            throw new Error("Parametri ID o timestamp 'since' non validi.");
        }

        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT b.updated_at AS board_updated_at, g.updated_at AS group_updated_at
                 FROM boards b JOIN groups g ON b.group_id = g.id
                 WHERE b.id = ? AND b.group_id = ?`,
                [numericBId, numericGId]
            );

            if (rows.length === 0) {
                throw new Error(`Lavagna ${numericBId} non trovata o non appartenente al gruppo ${numericGId}.`);
            }

            const dbBoardTimestamp = new Date(rows[0].board_updated_at).getTime();
            const dbGroupTimestamp = new Date(rows[0].group_updated_at).getTime();
            const mostRecentDbUpdateTs = Math.max(dbBoardTimestamp, dbGroupTimestamp);

            const hasUpdates = mostRecentDbUpdateTs > clientTimestamp;

            if (hasUpdates) {
                console.log(`[Service-Group Status] Aggiornamento Rilevato! DB_TS: ${mostRecentDbUpdateTs} > Client_TS: ${clientTimestamp} (G:${numericGId}, B:${numericBId})`);
            } else {
                // console.log(`[Service-Group Status] Nessun Aggiornamento. DB_TS: ${mostRecentDbUpdateTs} <= Client_TS: ${clientTimestamp}`);
            }

            return {
                hasUpdates: hasUpdates,
                lastUpdateTimestamp: mostRecentDbUpdateTs
            };

        } catch (error) {
            if (!error.message.includes("non trovata")) {
                console.error(`[Service-Group Status] Errore DB G:${numericGId}, B:${numericBId}:`, error);
            }
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
    // --- FINE MODIFICA getGroupBoardStatus ---

}

module.exports = new GroupService();