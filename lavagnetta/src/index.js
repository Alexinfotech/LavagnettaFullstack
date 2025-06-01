// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // <-- 1. AGGIUNGI QUESTO IMPORT

// Importazione di Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Importazione di Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';

// Importazione di Slick Carousel CSS
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Importazione di React Toastify CSS (opzionale)
import 'react-toastify/dist/ReactToastify.css';

// Importazione dei CSS di FullCalendar
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
// Nota: hai importato ReactToastify.css due volte, puoi rimuovere una delle due righe
// import 'react-toastify/dist/ReactToastify.css'; // <-- Rimuovi questa riga duplicata

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register(); // <-- 2. AGGIUNGI QUESTA CHIAMATA

// Non è più necessario (di solito viene gestito dal service worker o non serve per PWA base)
// reportWebVitals();