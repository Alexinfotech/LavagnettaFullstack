// frontend/src/services/api.js
import axios from 'axios';
import authService from './authService'; // Manteniamo l'import per il token

const API_URL = '/api';
console.log('API_URL configurato:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // Aumentato leggermente il timeout
    withCredentials: true, // Mantenuto se usi cookies/sessioni, altrimenti non necessario per JWT Bearer
    validateStatus: status => {
        // console.log('Status risposta:', status); // Log meno verboso
        return status >= 200 && status < 300; // Solo status 2xx sono considerati successo
    }
});

// --- RIMOSSO checkInactivity e updateLastActivity da qui ---
// La gestione dell'inattività è centralizzata in App.jsx

// Aggiungi l'interceptor per includere il token in tutte le richieste
api.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            // console.log('Token aggiunto alla richiesta:', token); // Riduci verbosità log
        }
        // --- RIMOSSA CHIAMATA a checkInactivity() ---
        return config;
    },
    (error) => {
        // Log solo dell'errore della richiesta
        console.error('Errore nella configurazione della richiesta API:', error);
        return Promise.reject(error);
    }
);

// Aggiungi interceptor per la gestione delle risposte (meno verboso)
api.interceptors.response.use(
    (response) => {
        // console.log('Risposta API ricevuta:', { // Riduci verbosità log
        //     url: response.config.url,
        //     status: response.status,
        //     // data: response.data // Evita di loggare potenzialmente grandi quantità di dati
        // });
        return response;
    },
    (error) => {
        // Log più dettagliato dell'errore di risposta
        console.error('Errore nella risposta API:', {
            message: error.message,
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
        });

        // --- GESTIONE TOKEN SCADUTO (401 Unauthorized) ---
        // Se l'errore è 401 e non è la rotta di login/register/renew (per evitare loop),
        // prova a fare logout.
        if (error.response?.status === 401) {
            const originalRequestUrl = error.config.url;
            // Evita logout immediato su fallimento login/register/renew
            if (!originalRequestUrl.includes('/auth/login') &&
                !originalRequestUrl.includes('/auth/register') &&
                !originalRequestUrl.includes('/auth/renew-token')) {
                console.warn('Ricevuto 401 (Unauthorized), token scaduto o non valido. Eseguo logout.');
                // Ritarda leggermente il logout per permettere ad altri processi di terminare
                setTimeout(() => authService.logout(), 100);
            }
        }
        // --- FINE GESTIONE TOKEN SCADUTO ---

        return Promise.reject(error); // Rilancia l'errore per essere gestito dal chiamante (.catch)
    }
);

export default api;