// src/serviceWorkerRegistration.js

// Questo codice opzionale viene usato per registrare un service worker.
// register() non è chiamato di default.

// Questo permette all'app di caricare più velocemente nelle visite successive in produzione,
// e le dà capacità offline. Tuttavia, significa anche che gli sviluppatori (e gli utenti)
// vedranno gli aggiornamenti deployati solo nelle visite successive a una pagina, dopo che
// tutte le tab esistenti aperte sulla pagina sono state chiuse, poiché le risorse
// precedentemente cachate sono aggiornate in background.

// Per saperne di più sui benefici di questo modello e sulle istruzioni su come
// opt-in, leggi https://cra.link/PWA

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    // [::1] è l'indirizzo IPv6 di localhost.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 sono considerati localhost per IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        // Il costruttore URL è disponibile in tutti i browser che supportano SW.
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            // Il nostro service worker non funzionerà se PUBLIC_URL è su un'origine differente
            // da quella su cui è servita la nostra pagina. Questo potrebbe succedere se un CDN viene
            // usato per servire gli asset; vedi https://github.com/facebook/create-react-app/issues/2374
            return;
        }

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

            if (isLocalhost) {
                // Questo sta girando su localhost. Controlliamo se un service worker esiste ancora o no.
                checkValidServiceWorker(swUrl, config);

                // Aggiungi qualche log addizionale a localhost, puntando gli sviluppatori alla
                // documentazione del service worker/PWA.
                navigator.serviceWorker.ready.then(() => {
                    console.log(
                        'This web app is being served cache-first by a service ' +
                        'worker. To learn more, visit https://cra.link/PWA'
                    );
                });
            } else {
                // Non è localhost. Registra semplicemente il service worker
                registerValidSW(swUrl, config);
            }
        });
    }
}

function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // A questo punto, il contenuto precachato aggiornato è stato fetchato,
                            // ma il service worker precedente servirà ancora il contenuto vecchio
                            // finché tutte le tab client non saranno chiuse.
                            console.log(
                                'New content is available and will be used when all ' +
                                'tabs for this page are closed. See https://cra.link/PWA.'
                            );

                            // Esegui callback se ne è stata fornita una
                            if (config && config.onUpdate) {
                                config.onUpdate(registration);
                            }
                        } else {
                            // A questo punto, tutto è stato precachato.
                            // È il momento perfetto per mostrare un messaggio
                            // "Content is cached for offline use.".
                            console.log('Content is cached for offline use.');

                            // Esegui callback se ne è stata fornita una
                            if (config && config.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                };
            };
        })
        .catch((error) => {
            console.error('Error during service worker registration:', error);
        });
}

function checkValidServiceWorker(swUrl, config) {
    // Controlla se il service worker può essere trovato. Se non può, ricarica la pagina.
    fetch(swUrl, {
        headers: { 'Service-Worker': 'script' },
    })
        .then((response) => {
            // Assicurati che il service worker esista, e che stiamo realmente ottenendo un file JS.
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                // Nessun service worker trovato. Probabilmente un'app differente. Ricarica la pagina.
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                // Service worker trovato. Procedi normalmente.
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            console.log('No internet connection found. App is running in offline mode.');
        });
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}