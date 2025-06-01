// backend/services/authService.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const boardModel = require('../models/boardModel');
require('dotenv').config();

const saltRounds = 10;
const JWT_EXPIRATION = '8h'; // <-- NUOVA DURATA TOKEN (8 ore)

// --- registerUser ---
const registerUser = async (email, password, username) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        console.log("Inizio transazione registrazione...");

        const [existingUser] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            console.log("Registrazione fallita: Email già in uso.");
            return { success: false, message: 'Email già in uso.' };
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [result] = await connection.execute(
            'INSERT INTO users (email, password, username, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [email, hashedPassword, username]
        );
        const userId = result.insertId;
        console.log(`Utente creato con ID: ${userId}`);

        const defaultBoardName = "La Mia Prima Lavagnetta";
        const defaultBackground = "blackboard.jpg";
        await boardModel.createBoard(
            userId, defaultBoardName, defaultBackground, null, false, connection
        );
        console.log(`Lavagnetta personale di default creata per utente ID: ${userId}`);

        const tokenPayload = { id: userId, username: username, email: email };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION }); // <-- Usa durata
        console.log(`Token generato per utente ID: ${userId} (scade in ${JWT_EXPIRATION})`);

        try {
            await connection.execute('INSERT INTO interactions (user_id, interaction, response) VALUES (?, ?, ?)', [userId, 'Register', 'Success']);
        } catch (logError) {
            console.error("Errore durante il logging dell'interazione (Register):", logError);
        }

        await connection.commit();
        console.log("Transazione registrazione completata con successo.");
        return { success: true, message: 'Registrazione riuscita.', token };

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Errore nel servizio di registrazione:', error);
        try {
            await db.execute('INSERT INTO interactions (user_id, interaction, response) VALUES (?, ?, ?)', [null, 'Register', `Errore: ${error.message}`]);
        } catch (logError) {
            console.error("Errore durante il logging dell'interazione (Register Error):", logError);
        }
        return { success: false, message: 'Errore durante la registrazione.' };
    } finally {
        if (connection) connection.release();
        console.log("Connessione DB rilasciata.");
    }
};


// --- loginUser ---
const loginUser = async (email, password) => {
    let userIdForLog = null;
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute('SELECT id, password, username, email FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            try {
                await connection.execute('INSERT INTO interactions (user_id, interaction, response) VALUES (?, ?, ?)', [null, 'Login', 'Credenziali non valide (email non trovata)']);
            } catch (logError) {
                console.error("Errore logging interazione (Login Fail Email):", logError);
            }
            return { success: false, message: 'Credenziali non valide.' };
        }

        const user = rows[0];
        userIdForLog = user.id;
        console.log('Login: Utente trovato:', user.username, `ID: ${user.id}`);

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            try {
                await connection.execute('INSERT INTO interactions (user_id, interaction, response) VALUES (?, ?, ?)', [user.id, 'Login', 'Credenziali non valide (password errata)']);
            } catch (logError) {
                console.error("Errore logging interazione (Login Fail Pass):", logError);
            }
            return { success: false, message: 'Credenziali non valide.' };
        }

        console.log(`Login: Verifico lavagna default per utente ID: ${user.id}`);
        const [personalBoards] = await connection.execute(
            'SELECT id, is_default FROM boards WHERE user_id = ? AND group_id IS NULL ORDER BY created_at ASC',
            [user.id]
        );

        let defaultBoardExists = false;
        if (personalBoards.length > 0) {
            defaultBoardExists = personalBoards.some(board => board.is_default === 1);
            console.log(`Login: Trovate ${personalBoards.length} lavagne personali. Default esistente: ${defaultBoardExists}`);
            if (!defaultBoardExists) {
                const firstBoardId = personalBoards[0].id;
                console.log(`Login: Imposto lavagna ID: ${firstBoardId} come default.`);
                await connection.execute('UPDATE boards SET is_default = 0 WHERE user_id = ? AND group_id IS NULL', [user.id]);
                await connection.execute('UPDATE boards SET is_default = 1 WHERE id = ? AND user_id = ?', [firstBoardId, user.id]);
            }
        } else {
            console.log(`Login: Nessuna lavagna personale. Creo la default.`);
            const defaultBoardName = "La Mia Lavagnetta";
            const defaultBackground = "blackboard.jpg";
            await boardModel.createBoard(user.id, defaultBoardName, defaultBackground, null, false, connection);
        }

        const tokenPayload = { id: user.id, username: user.username, email: user.email };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION }); // <-- Usa durata
        console.log(`Login: Token generato per utente ID: ${user.id} (scade in ${JWT_EXPIRATION})`);

        try {
            await connection.execute('INSERT INTO interactions (user_id, interaction, response) VALUES (?, ?, ?)', [user.id, 'Login', 'Success']);
        } catch (logError) {
            console.error("Errore logging interazione (Login Success):", logError);
        }

        return { success: true, message: 'Login riuscito.', token };

    } catch (error) {
        console.error('Errore nel servizio di login:', error);
        try {
            const logConnection = connection || db;
            await logConnection.execute('INSERT INTO interactions (user_id, interaction, response) VALUES (?, ?, ?)', [userIdForLog, 'Login', `Errore: ${error.message}`]);
        } catch (logError) {
            console.error("Errore logging interazione (Login Error):", logError);
        }
        return { success: false, message: 'Errore durante il login.' };
    } finally {
        if (connection) connection.release();
        console.log("Connessione DB rilasciata dopo il login.");
    }
};


// --- renewToken ---
const renewToken = async (userId) => {
    console.log(`Tentativo di rinnovo token per user ID: ${userId}`);
    const connection = await db.getConnection();
    try {
        const [rows] = await connection.execute('SELECT id, username, email FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            console.error(`Utente non trovato per rinnovo token: ID ${userId}`);
            throw new Error('Utente non trovato per il rinnovo del token.');
        }
        const user = rows[0];
        const tokenPayload = { id: user.id, username: user.username, email: user.email };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRATION }); // <-- Usa durata
        console.log(`Token rinnovato per user ID: ${userId} (scade in ${JWT_EXPIRATION})`);
        return token;
    } catch (error) {
        console.error(`Errore durante il rinnovo del token per user ID ${userId}:`, error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};


module.exports = { registerUser, loginUser, renewToken };