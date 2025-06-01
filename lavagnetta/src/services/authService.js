// src/services/authService.js

import jwt_decode from 'jwt-decode';
import api from './api';

/**
 * Registra un nuovo utente e salva il token e il nome utente.
 * @param {string} email - Email dell'utente.
 * @param {string} password - Password dell'utente.
 * @param {string} username - Username dell'utente.
 * @returns {Object} - Risultato della registrazione.
 */
const register = async (email, password, username) => {
    try {
        const response = await api.post('/auth/register', { email, password, username });
        if (response.data.token) {
            setToken(response.data.token);
            setUsername(username); // Salviamo il nome utente
        }
        return response.data;
    } catch (error) {
        console.error("Errore durante la registrazione:", error);
        throw error;
    }
};

/**
 * Effettua il login dell'utente e salva il token e il nome utente.
 * @param {string} email - Email dell'utente.
 * @param {string} password - Password dell'utente.
 * @returns {Object} - Risultato del login.
 */
const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            setToken(response.data.token);
            // Decodifichiamo il token per ottenere il nome utente
            const decodedToken = jwt_decode(response.data.token);
            const username = decodedToken.username; // Assicurati che il token contenga il campo 'username'
            setUsername(username);
        }
        return response.data;
    } catch (error) {
        console.error("Errore durante il login:", error);
        throw error;
    }
};

/**
 * Richiede un nuovo token al backend.
 * @returns {Object} - Risultato del rinnovo del token.
 */
const renewToken = async () => {
    try {
        const response = await api.post('/auth/renew-token');
        if (response.data.token) {
            setToken(response.data.token);
            // Aggiorniamo anche il nome utente se necessario
            const decodedToken = jwt_decode(response.data.token);
            const username = decodedToken.username;
            setUsername(username);
        }
        return response.data;
    } catch (error) {
        console.error("Errore durante il rinnovo del token:", error);
        throw error;
    }
};

/**
 * Resetta completamente la sessione dell'utente.
 */
const resetSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('lastActivity');
};

/**
 * Effettua il logout dell'utente, distruggendo la sessione e reindirizzando al login.
 */
const logout = () => {
    resetSession();
    window.location.replace('/auth/login'); // Reindirizza alla pagina di login
};

/**
 * Salva il token nel localStorage.
 * @param {string} token - Token JWT.
 */
const setToken = (token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('lastActivity', Date.now());
    console.log('Token salvato nel localStorage:', token);
};

/**
 * Salva il nome utente nel localStorage.
 * @param {string} username - Nome utente.
 */
const setUsername = (username) => {
    localStorage.setItem('username', username);
    console.log('Nome utente salvato nel localStorage:', username);
};

/**
 * Recupera il token dal localStorage.
 * @returns {string|null} - Token JWT o null se non presente.
 */
const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Recupera il nome utente dal localStorage.
 * @returns {string|null} - Nome utente o null se non presente.
 */
const getUsername = () => {
    return localStorage.getItem('username');
};

/**
 * Verifica se l'utente è loggato controllando la validità del token.
 * @returns {boolean} - True se loggato e token valido, false altrimenti.
 */
const isLoggedIn = () => {
    const token = getToken();
    if (!token) {
        console.log('Nessun token trovato.');
        return false;
    }

    try {
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000; // Tempo corrente in secondi
        const isValid = decoded.exp > currentTime;
        console.log('Token decodificato:', decoded);
        console.log('Token valido:', isValid);
        return isValid;
    } catch (error) {
        console.error("Token non valido:", error);
        return false;
    }
};

const authService = {
    register,
    login,
    renewToken,
    logout,
    setToken,
    getToken,
    isLoggedIn,
    resetSession,
    getUsername, // Esponiamo il metodo getUsername
};

export default authService;
