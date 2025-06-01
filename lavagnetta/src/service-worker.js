// src/service-worker.js

// Questo file è un punto di partenza per implementare la logica del tuo service worker.
// Sarà compilato usando Workbox durante il processo di build per generare il
// file build/service-worker.js, che includerà l'iniezione del manifest di precache.

/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

clientsClaim();

// Precaching di tutti gli asset inclusi nel manifest di Workbox.
// Questo array `self.__WB_MANIFEST` viene popolato dal plugin Workbox durante la build.
precacheAndRoute(self.__WB_MANIFEST);

// Configura il routing per l'App Shell (per SPA - Single Page Applications)
// Fa sì che le navigazioni verso URL non precachati (es. /miopercorso)
// vengano gestite servendo /index.html.
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
    // Ritorna false per le richieste che sembrano essere per file statici.
    ({ request, url }) => {
        // Se non è una richiesta di navigazione, salta.
        if (request.mode !== 'navigate') {
            return false;
        }

        // Se è un URL che inizia con /_, salta.
        if (url.pathname.startsWith('/_')) {
            return false;
        }

        // Se sembra essere un URL per una risorsa (contiene un'.'), salta.
        if (url.pathname.match(fileExtensionRegexp)) {
            return false;
        }

        // Ritorna true per gestire la richiesta con l'handler.
        return true;
    },
    createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Esempio di caching runtime con strategia StaleWhileRevalidate per le immagini.
// Le richieste verranno servite prima dalla cache (se disponibile e valida),
// mentre Workbox tenta di aggiornare la risorsa in background.
// Utile per risorse che non cambiano frequentemente ma per cui è importante
// avere sempre l'ultima versione quando possibile.
registerRoute(
    // Aggiungi qui altri percorsi o tipi di file che vuoi cachare runtime.
    // Ad esempio, per cachare immagini:
    ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.png'),
    new StaleWhileRevalidate({
        cacheName: 'images',
        plugins: [
            // Assicura che vengano cachate al massimo 50 immagini per un massimo di 30 giorni.
            new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 Days
        ],
    })
);

// Questo permette alla web app di triggerare skipWaiting via registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Qualsiasi altra logica custom del service worker può andare qui.