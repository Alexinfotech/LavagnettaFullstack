// backend/services/notificationService.js
const pool = require("../config/db");
// const groupService = require("./groupService"); // Mantenuto commentato/spostato l'import in cima

class NotificationService {

    /**
     * Crea una notifica nel database.
     * Può operare con una connessione esistente (per transazioni) o crearne una nuova.
     * NON gestisce commit/rollback se la connessione è fornita.
     * @param {number} userId - ID utente destinatario.
     * @param {string} message - Messaggio della notifica.
     * @param {object|string} data - Dati JSON associati (saranno stringhificati).
     * @param {object|null} conn - Connessione DB esistente (opzionale).
     * @returns {Promise<number|null>} - ID della notifica creata o null in caso di errore grave.
     */
    async createNotification(userId, message, data, conn = null) {
        const connection = conn || await pool.getConnection();
        const isLocalConnection = !conn; // Vero se abbiamo creato noi la connessione
        let dataString = null;

        try {
            // Stringhifica i dati in modo sicuro
            if (typeof data === 'object' && data !== null) {
                try {
                    dataString = JSON.stringify(data);
                } catch (stringifyError) {
                    console.error("[Service-Notif] Errore durante JSON.stringify:", stringifyError);
                    throw new Error("Impossibile serializzare i dati della notifica.");
                }
            } else if (typeof data === 'string') {
                dataString = data;
            }

            // Verifica userId prima della query
            if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
                console.error(`[Service-Notif] Tentativo creazione notifica con userId non valido: ${userId}`);
                throw new Error("ID utente non valido per la notifica.");
            }

            // Esegui l'inserimento
            const sql = "INSERT INTO notifications (user_id, message, data, is_read, created_at) VALUES (?, ?, ?, 0, NOW())";
            const params = [userId, message, dataString];
            console.log("[Service-Notif] Eseguo INSERT:", sql, params);
            const [result] = await connection.execute(sql, params);

            const notificationId = result.insertId;

            // Verifica se l'ID è valido
            if (typeof notificationId !== 'number' || notificationId <= 0) {
                console.error(`[Service-Notif] Errore critico: INSERT riuscito ma insertId non valido: ${notificationId}. Result:`, result);
                throw new Error("Impossibile ottenere ID notifica dopo creazione.");
            }

            console.log(`[Service-Notif] Notifica ${notificationId} creata per User ${userId}.`);
            return notificationId; // *** RESTITUISCE SEMPRE L'ID QUI ***

        } catch (error) {
            // Log Dettagliato dell'Errore specifico dell'INSERT
            console.error(`[Service-Notif] Errore durante INSERT in notifications per User ${userId}:`);
            console.error("  - Messaggio:", error.message);
            console.error("  - Codice Errore DB:", error.code);
            console.error("  - Messaggio SQL:", error.sqlMessage);
            console.error("  - Dati Tentati:", { userId, message, dataString });
            throw error; // Rilancia l'errore
        } finally {
            // Rilascia la connessione SOLO se l'abbiamo creata noi qui
            if (isLocalConnection && connection) {
                connection.release();
            }
        }
    }

    // Recupera le notifiche NON LETTE per un utente
    async getUserNotifications(userId) {
        // console.log(`[Service-Notif] getUserNotifications: Recupero notifiche NON LETTE per User ${userId}`); // Riduci log
        try {
            const [notifications] = await pool.execute(
                // Seleziona tutti i campi necessari
                "SELECT id, user_id, message, data, is_read, created_at FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC",
                [userId]
            );
            // console.log(`[Service-Notif] getUserNotifications: Query eseguita. Trovate ${notifications.length} notifiche non lette.`); // Riduci log

            // Parsa il campo 'data' da JSON string a Oggetto JS
            notifications.forEach((notification) => {
                if (notification.data && typeof notification.data === 'string') {
                    try {
                        notification.data = JSON.parse(notification.data);
                    } catch (e) {
                        console.warn(`Impossibile parsare data per notifica ${notification.id}:`, notification.data);
                        notification.data = null; // Imposta a null se JSON non valido
                    }
                } else if (notification.data && typeof notification.data !== 'object') {
                    console.warn(`Formato data imprevisto per notifica ${notification.id}:`, typeof notification.data);
                    notification.data = null;
                } else if (!notification.data) {
                    notification.data = null; // Assicura null se era vuoto/null dal DB
                }
            });
            return notifications;
        } catch (error) {
            console.error(`[Service-Notif] Errore in getUserNotifications per User ${userId}:`, error);
            throw error; // Rilancia l'errore
        }
    }

    // Accetta una notifica (invito gruppo o cambio ruolo)
    async acceptNotification(notificationId, userId, conn = null) {
        // Usa l'import locale di groupService per evitare dipendenze circolari all'avvio
        const groupService = require("./groupService");

        const connection = conn || await pool.getConnection();
        const isLocalConnection = !conn;

        try {
            if (isLocalConnection) await connection.beginTransaction();

            console.log(`[Service-Notif] acceptNotification: User ${userId} accetta Notif ${notificationId}`);
            const [rows] = await connection.execute("SELECT * FROM notifications WHERE id = ? AND user_id = ?", [notificationId, userId]);
            if (rows.length === 0) throw new Error("Notifica non trovata o non appartenente all'utente.");

            const notification = rows[0];
            // Evita azioni multiple sulla stessa notifica
            if (notification.is_read === 1) {
                console.warn(`[Service-Notif] acceptNotification: Notifica ${notificationId} già processata.`);
                if (isLocalConnection) await connection.rollback();
                return false; // Indica che non è stato fatto nulla di nuovo
            }

            let data;
            try { data = notification.data ? JSON.parse(notification.data) : null; }
            catch (e) { throw new Error("Dati notifica corrotti."); }

            if (!data || !data.type) throw new Error("Tipo di notifica mancante o dati invalidi.");

            let operationSuccessful = false; // Flag per sapere se toccare il gruppo/segnare come letta

            // Gestione Invito a Gruppo
            if (data.type === "GROUP_INVITE") {
                if (!data.groupId) throw new Error("ID Gruppo mancante nei dati invito.");
                const [updateResult] = await connection.execute(
                    // Aggiorna accepted_at e rimuove notification_id dal membro pendente
                    "UPDATE group_members SET accepted_at = NOW(), notification_id = NULL WHERE group_id = ? AND user_id = ? AND notification_id = ?",
                    [data.groupId, userId, notificationId]
                );
                // Se nessuna riga è stata aggiornata, l'invito non era valido/trovato
                if (updateResult.affectedRows === 0) throw new Error("Invito al gruppo non trovato, già accettato/rifiutato o scaduto.");
                console.log(`[Service-Notif] Invito a gruppo ${data.groupId} accettato per User ${userId}.`);
                await this._touchGroup(data.groupId, connection); // Aggiorna updated_at del gruppo
                operationSuccessful = true;

                // Gestione Richiesta Cambio Ruolo
            } else if (data.type === "ROLE_CHANGE_REQUEST") {
                const { groupId, targetUserId, newRole, requestedByUserId } = data;
                if (!groupId || !targetUserId || !newRole || !requestedByUserId) throw new Error("Dati richiesta cambio ruolo incompleti.");
                // Solo l'utente target può accettare
                if (userId !== targetUserId) throw new Error("Questa notifica non può essere accettata da te.");

                // Verifica esistenza groupService e metodo (difesa contro dipendenze circolari residue)
                if (!groupService || typeof groupService.updateMemberRole !== 'function') {
                    console.error("[Service-Notif] Errore CRITICO: groupService o groupService.updateMemberRole non disponibili!");
                    throw new TypeError("Funzione groupService.updateMemberRole non trovata");
                }
                // Chiama il servizio per aggiornare il ruolo, passando la connessione attiva
                await groupService.updateMemberRole(groupId, targetUserId, newRole, null, connection); // Passa actingUserId=null e conn
                console.log(`[Service-Notif] Richiesta cambio ruolo a ${newRole} per User ${targetUserId} nel gruppo ${groupId} accettata.`);
                // Nota: _touchGroup viene già chiamato DENTRO groupService.updateMemberRole
                operationSuccessful = true;

            } else {
                // Tipo di notifica non riconosciuto per l'azione "accetta"
                throw new Error(`Tipo di notifica non gestito per accettazione: ${data.type}`);
            }

            // Segna la notifica come letta SOLO se un'azione è stata completata con successo
            if (operationSuccessful) {
                await connection.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", [notificationId]);
                console.log(`[Service-Notif] Notifica ${notificationId} segnata come letta.`);
            } else {
                // Se nessuna azione specifica è stata fatta (es. notifica già letta), annulla transazione locale
                if (isLocalConnection) await connection.rollback();
                return false;
            }

            // Commit finale solo se la transazione è stata iniziata qui
            if (isLocalConnection) await connection.commit();
            return true; // Indica successo

        } catch (error) {
            if (isLocalConnection) await connection.rollback(); // Rollback se transazione locale
            console.error(`[Service-Notif] Errore in acceptNotification (Notif ${notificationId}, User ${userId}):`, error);
            throw error; // Rilancia per il controller
        } finally {
            if (isLocalConnection && connection) connection.release(); // Release se connessione locale
        }
    }

    // Rifiuta una notifica (invito gruppo o cambio ruolo)
    async rejectNotification(notificationId, userId, conn = null) {
        const connection = conn || await pool.getConnection();
        const isLocalConnection = !conn;
        try {
            if (isLocalConnection) await connection.beginTransaction();
            console.log(`[Service-Notif] rejectNotification: User ${userId} rifiuta Notif ${notificationId}`);

            const [rows] = await connection.execute("SELECT * FROM notifications WHERE id = ? AND user_id = ?", [notificationId, userId]);
            if (rows.length === 0) throw new Error("Notifica non trovata o non appartenente all'utente.");

            const notification = rows[0];
            if (notification.is_read === 1) {
                console.warn(`[Service-Notif] rejectNotification: Notifica ${notificationId} già processata.`);
                if (isLocalConnection) await connection.rollback();
                return; // Esce se già letta
            }
            let data; try { data = notification.data ? JSON.parse(notification.data) : null; } catch (e) { throw new Error("Dati notifica corrotti."); }
            if (!data || !data.type) throw new Error("Tipo di notifica mancante o dati invalidi.");

            // Gestione Rifiuto Invito Gruppo
            if (data.type === "GROUP_INVITE") {
                if (!data.groupId) throw new Error("ID Gruppo mancante nei dati invito.");
                // Rimuovi la riga pendente da group_members
                const [deleteResult] = await connection.execute(
                    "DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND notification_id = ?",
                    [data.groupId, userId, notificationId]
                );
                if (deleteResult.affectedRows === 0) console.warn(`[Service-Notif] rejectNotification: Membro pendente ${userId} non trovato/già rimosso per gruppo ${data.groupId}.`);
                else console.log(`[Service-Notif] Invito a gruppo ${data.groupId} rifiutato e rimosso per User ${userId}.`);
                // Non si tocca il gruppo al rifiuto

                // Gestione Rifiuto Cambio Ruolo
            } else if (data.type === "ROLE_CHANGE_REQUEST") {
                const { targetUserId } = data;
                // Solo l'utente target può rifiutare
                if (userId !== targetUserId) throw new Error("Questa notifica non può essere rifiutata da te.");
                console.log(`[Service-Notif] Richiesta cambio ruolo rifiutata da User ${userId}. Nessuna azione DB richiesta sul ruolo.`);
            } else {
                throw new Error(`Tipo di notifica non gestito per rifiuto: ${data.type}`);
            }

            // Segna la notifica come letta in ogni caso (rifiuto avvenuto o non necessario)
            await connection.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", [notificationId]);
            console.log(`[Service-Notif] Notifica ${notificationId} segnata come letta (dopo rifiuto).`);

            if (isLocalConnection) await connection.commit(); // Commit se transazione locale

        } catch (error) {
            if (isLocalConnection) await connection.rollback(); // Rollback se transazione locale
            console.error(`[Service-Notif] Errore in rejectNotification (Notif ${notificationId}, User ${userId}):`, error);
            throw error; // Rilancia al controller
        } finally {
            if (isLocalConnection && connection) connection.release(); // Release se connessione locale
        }
    }

    // Funzione helper per recuperare dati notifica (usata da handleInvite deprecato)
    async getNotificationData(notificationId, userId, conn = null) {
        const connection = conn || pool;
        const [rows] = await connection.execute("SELECT data FROM notifications WHERE id = ? AND user_id = ?", [notificationId, userId]);
        if (rows.length === 0) return null;
        try { return rows[0].data ? JSON.parse(rows[0].data) : null; } catch (e) { return null; }
    }

    // Funzione helper per toccare il gruppo (usata internamente da acceptNotification)
    async _touchGroup(groupId, conn) {
        if (!conn) { console.error("[Service-Notif:_touchGroup] Chiamato senza connessione!"); return; }
        try {
            const numericGroupId = parseInt(groupId);
            if (!numericGroupId || numericGroupId <= 0) { console.warn(`[Service-Notif:_touchGroup] ID gruppo non valido: ${groupId}`); return; }
            await conn.execute('UPDATE groups SET updated_at = NOW() WHERE id = ?', [numericGroupId]);
            // console.log(`[Service-Notif] Toccato updated_at per Group ${numericGroupId} via notifica.`); // Log ridotto
        } catch (touchError) {
            console.error(`[Service-Notif] Errore (non bloccante) durante il touch del gruppo ${groupId} da notifica:`, touchError);
        }
    }

}

module.exports = new NotificationService();