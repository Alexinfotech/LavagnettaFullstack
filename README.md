## Lavagnetta Interattiva con Chatbot AI & PWA

[![Licenza]

## Indice

1.  [Descrizione del Progetto](#descrizione-del-progetto)
2.  [Perché questo Progetto?](#perché-questo-progetto)
3.  [Stack Tecnologico](#stack-tecnologico)
4.  [Caratteristiche Principali](#caratteristiche-principali)
    - [Funzionalità PWA](#funzionalità-pwa)
5.  [Struttura del Progetto](#struttura-del-progetto)
    - [Frontend (React)](#frontend-react)
    - [Backend (Node.js con Chatbot Integrato)](#backend-nodejs-con-chatbot-integrato)
6.  [Installazione e Avvio](#installazione-e-avvio)
    - [Prerequisiti](#prerequisiti)
    - [1. Clonare il Repository](#1-clonare-il-repository)
    - [2. Configurazione Database (MariaDB)](#2-configurazione-database-mariadb)
    - [3. Setup Backend Node.js](#3-setup-backend-nodejs)
    - [4. Setup Frontend React](#4-setup-frontend-react)
    - [Variabili d'Ambiente](#variabili-dambiente)
7.  [Dipendenze del Progetto](#dipendenze-del-progetto)
    - [Frontend (React)](#frontend-react-1)
    - [Backend (Node.js)](#backend-nodejs-1)
8.  [Struttura del Database](#struttura-del-database)
    - [Elenco Tabelle](#elenco-tabelle)
    - [Definizione Tabelle (SHOW CREATE TABLE)](#definizione-tabelle-show-create-table)
    - [Script SQL per la Creazione Pulita delle Tabelle](#script-sql-per-la-creazione-pulita-delle-tabelle)
9.  [Funzionalità Avanzate e Roadmap](#funzionalità-avanzate-e-roadmap)
10. [Contribuire](#contribuire)
11. [Licenza](#licenza-1)

---

## Descrizione del Progetto

**Lavagnetta Interattiva** è un'applicazione full-stack **PWA (Progressive Web App)** installabile, progettata per la gestione collaborativa di liste della spesa e attività. È arricchita da "Ambrogio", un chatbot intelligente basato su AI (integrato nel backend Node.js e che utilizza Google Gemini), per assistere gli utenti nella pianificazione dei pasti, nella creazione di ricette e nell'aggiunta di prodotti. Il progetto presenta un frontend reattivo costruito con React e un backend robusto in Node.js che gestisce tutte le operazioni CRUD e l'orchestrazione del chatbot.

L'applicazione permette agli utenti di creare lavagnette personali o di gruppo, invitare altri utenti, gestire i permessi all'interno dei gruppi e interagire con un assistente virtuale per ottimizzare la gestione della spesa e della cucina, il tutto con la possibilità di installare l'app sul proprio dispositivo per un accesso rapido e funzionalità offline di base.

## Perché questo Progetto?

L'idea nasce dalla necessità di avere uno strumento flessibile e intelligente per la gestione condivisa delle liste. Invece di implementare una messaggistica istantanea basata su socket, si è optato per un sistema di **ricarica costante dei dati dal database** per visualizzare gli aggiornamenti, mantenendo l'architettura più snella per lo scopo prefissato.

Il progetto è stato concepito con un occhio alle **potenzialità future**, quali:

- **Inviti utente**: Possibilità di invitare utenti già iscritti o implementare un sistema di invio email (con dominio e DNS dedicati) per nuovi utenti.
- **Gestione granulare dei permessi**: Due livelli di grant per gli utenti all'interno dei gruppi, decisi autonomamente da ciascun gruppo.
- **Chatbot "Ambrogio" evoluto**:
  - Assistenza per la spesa e ricette (anche "svuota-frigo").
  - Potenziale integrazione con catene di supermercati per suggerire prodotti in offerta, spingere determinati articoli (sempre su richiesta dell'utente per una ricetta), o generare QR code sconto per acquisti in negozio.
- **Profilazione Utenti e Raccolta Dati**: La struttura del DB permette di profilare gli utenti in base alle scelte, ai prodotti acquistati e inseriti nelle lavagnette, aprendo la strada a campagne marketing personalizzate e analisi dei consumi (nel rispetto della privacy e con le dovute implementazioni).
- **Campagne Marketing e QR Code Omaggio**: Ulteriori possibilità di engagement e fidelizzazione.

Questo repository mira a fornire una **soluzione completa e pronta all'uso** per chiunque voglia esplorare, utilizzare o estendere un'applicazione di questo tipo.

## Stack Tecnologico

- **Frontend**: React (con React Router, Context API, Bootstrap, Slick Carousel, FullCalendar, React Toastify)
- **Backend**: Node.js con Express.js (include logica per il Chatbot AI)
- **Intelligenza Artificiale Chatbot**: Google Gemini (integrato tramite il backend Node.js)
- **Database**: MariaDB
- **Autenticazione**: JWT (JSON Web Tokens)
- **PWA**: Service Worker, Web App Manifest
- **Altro**: Axios per chiamate API.

- ![Screenshot del Login](screenshot_monile.jpg)

## Caratteristiche Principali

- **Autenticazione Utenti**: Registrazione e Login sicuri.
- **Lavagnette Personali**: Gestione privata di liste e prodotti.
- **Lavagnette di Gruppo**:
  - Creazione e gestione di gruppi collaborativi.
  - Invito di membri con assegnazione di ruoli (Admin, Editor, Contributor).
  - Permessi differenziati per ruolo per la gestione delle lavagne e dei prodotti.
  - Lavagna di default per ogni gruppo.
- **Gestione Prodotti**:
  - Aggiunta, modifica del nome (con long-press/doppio click), eliminazione.
  - Marcatura prodotti come acquistati/da acquistare.
  - Visualizzazione dell'ultimo utente che ha modificato un prodotto (nelle lavagne di gruppo).
- **Chatbot "Ambrogio" (Integrato nel Backend Node.js)**:
  - Fornisce ricette su richiesta.
  - Suggerisce ricette "svuota-frigo".
  - Permette di aggiungere ingredienti direttamente alla lavagnetta selezionata (personale o di gruppo).
- **Notifiche**: Sistema di notifiche in-app per inviti a gruppi, richieste di cambio ruolo, ecc.
- **Personalizzazione**: Possibilità per ogni utente di impostare uno sfondo personalizzato per ciascuna lavagna (sia personale che di gruppo).
- **Calendario Note/Spese**: Un calendario integrato per aggiungere note o registrare le spese, con dettagli come importo, luogo e numero di prodotti.
- **Statistiche Spese**: Pagina dedicata per visualizzare grafici e riepiloghi delle spese registrate nel calendario (filtrabili per data e luogo).
- **Responsive Design**: Interfaccia utente adattabile a diverse dimensioni di schermo.

### Funzionalità PWA

- **Installabile**: L'applicazione può essere aggiunta alla schermata Home sui dispositivi mobili e desktop supportati per un'esperienza simile a quella di un'app nativa.
- **Offline-First (Base)**: Grazie al Service Worker, le risorse statiche principali vengono cachate, permettendo un caricamento più rapido e un accesso di base anche in assenza di connessione (le funzionalità dinamiche che richiedono il backend necessiteranno di connessione).
- **Web App Manifest**: Fornisce metadati come nome dell'app, icone, colori del tema per una migliore integrazione con il sistema operativo.

## Struttura del Progetto

Il repository è strutturato come un monorepo, contenente il frontend e il backend principale in sottocartelle, assumendo che la root del repository sia la cartella `react/` del tuo progetto:

```
react/  (Root del Repository Git)
├── lavagnetta/               (Frontend React)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
├── lavagnetta-backend/       (Backend Node.js con logica Chatbot)
│   ├── src/
│   ├── package.json
│   └── ...
├── .gitignore                (Globale per il monorepo)
└── README.md
```

### Frontend (React)

Posizione: `react/lavagnetta/`

Struttura della cartella `src/`:

```
.
├── App.css
├── App.jsx
├── App.test.js
├── auth
│   └── AuthContext.jsx
├── components
│   ├── Auth
│   │   ├── Login
│   │   │   ├── Login.css
│   │   │   └── Login.jsx
│   │   └── Register
│   │       ├── Register.css
│   │       └── Register.jsx
│   ├── Board
│   │   ├── actions
│   │   │   ├── addItem.js
│   │   │   ├── deleteItem.js
│   │   │   ├── fetchItems.js
│   │   │   ├── toggleBought.js
│   │   │   └── updateItemName.js
│   │   ├── Board.css
│   │   ├── Board.jsx
│   │   ├── Chatbot
│   │   │   ├── Chatbot.css
│   │   │   └── Chatbot.jsx
│   │   └── Modals
│   │       ├── ConfirmDeleteProductModal.css
│   │       └── ConfirmDeleteProductModal.jsx
│   ├── Dashboard
│   │   ├── Calendar
│   │   │   ├── Calendar.css
│   │   │   └── Calendar.jsx
│   │   ├── Dashboard.css
│   │   ├── Dashboard.jsx
│   │   └── Preview
│   │       ├── Preview.css
│   │       └── Preview.jsx
│   ├── ErrorBoundary
│   │   └── ErrorBoundary.jsx
│   ├── GroupCard.jsx
│   ├── GroupDashboard
│   │   ├── Boards
│   │   │   ├── GroupBoards.css
│   │   │   ├── GroupBoards.jsx
│   │   │   ├── GroupBoardsList.css
│   │   │   └── GroupBoardsList.jsx
│   │   ├── CreateGroupModal
│   │   │   ├── CreateGroupModal.css
│   │   │   └── CreateGroupModal.jsx
│   │   ├── GroupCard
│   │   │   ├── GroupCard.css
│   │   │   └── GroupCard.jsx
│   │   ├── GroupDashboard.css
│   │   ├── GroupDashboard.jsx
│   │   ├── GroupDetail
│   │   │   ├── ConfirmLeaveGroupModal.jsx
│   │   │   ├── GroupBoard.css
│   │   │   ├── GroupBoard.jsx
│   │   │   ├── GroupBoardView.css
│   │   │   ├── GroupBoardView.jsx
│   │   │   ├── GroupDetail.css
│   │   │   ├── GroupDetail.jsx
│   │   │   ├── GroupHeader.css
│   │   │   ├── GroupHeader.jsx
│   │   │   └── GroupSettingsModal.jsx
│   │   ├── GroupList
│   │   │   └── GroupList.jsx
│   │   ├── Members
│   │   │   ├── MemberManagement.jsx
│   │   │   ├── MembersList.css
│   │   │   └── MembersList.jsx
│   │   ├── Modals
│   │   │   ├── ConfirmDeleteGroupModal.jsx
│   │   │   ├── CreateBoardModal.jsx
│   │   │   ├── CreateGroupModal.jsx
│   │   │   ├── GroupSettingsModal.jsx
│   │   │   ├── InviteMembersModal.css
│   │   │   ├── InviteMembersModal.jsx
│   │   │   ├── MemberManagementModal.jsx
│   │   │   └── Modals.css
│   │   ├── PermissionLegend.css
│   │   └── PermissionLegend.jsx
│   ├── GroupDashboard.jsx
│   ├── Header
│   │   ├── Actions
│   │   │   ├── addBoard.js
│   │   │   ├── changeBackground.js
│   │   │   ├── deleteBoard.js
│   │   │   ├── fetchBoards.js
│   │   │   └── updateBoardName.js
│   │   ├── PersonalBoardSubHeader.css
│   │   └── PersonalBoardSubHeader.jsx
│   ├── InstallPrompt
│   │   ├── InstallPrompt.css
│   │   └── InstallPrompt.jsx
│   ├── LoadingSpinner
│   │   ├── LoadingSpinner.css
│   │   └── LoadingSpinner.jsx
│   ├── MainHeader
│   │   ├── MainHeader.css
│   │   └── MainHeader.jsx
│   ├── Notifications
│   │   ├── Notifications.css
│   │   └── Notifications.jsx
│   ├── PrivateRoute
│   │   └── PrivateRoute.jsx
│   ├── Statistics
│   │   ├── StatisticsPage.css
│   │   └── StatisticsPage.jsx
│   └── YourComponent.jsx
├── contexts
│   ├── AuthContext.js
│   ├── GroupContext.jsx
│   └── LayoutContext.jsx
├── index.css
├── index.js
├── logo.svg
├── server
│   ├── models
│   │   └── Group.js
│   └── routes
│       └── groups.js
├── service-worker.js
├── services
│   ├── api.js
│   ├── authService.js
│   ├── boardService.js
│   ├── ChatbotService.js
│   ├── groupService.js
│   ├── noteService.js
│   └── notificationService.js
├── serviceWorkerRegistration.js
├── setupTests.js
└── utils
    └── groupUtils.js
```

### Backend (Node.js con Chatbot Integrato)

Posizione: `react/lavagnetta-backend/`

Struttura della cartella `src/`:

```
.
├── app.js
├── config
│   ├── database.js
│   └── db.js
├── console.log
├── controllers
│   ├── authController.js
│   ├── boardController.js
│   ├── chatbotController.js
│   ├── groupController.js
│   ├── groupMemberController.js
│   ├── groupProductController.js
│   ├── noteController.js
│   ├── notificationController.js
│   ├── productController.js
│   ├── statisticsController.js
│   └── userBoardSettingsController.js
├── middleware
│   ├── authMiddleware.js
│   ├── groupAdmin.middleware.js
│   ├── groupAuth.middleware.js
│   ├── permissionMiddleware.js
│   └── product.middleware.js
├── models
│   ├── Board.js
│   ├── boardModel.js
│   └── productModel.js
├── routes
│   ├── authRoutes.js
│   ├── boardRoutes.js
│   ├── chatbotRoutes.js
│   ├── groupRoutes.js
│   ├── noteRoutes.js
│   ├── notificationRoutes.js
│   ├── statisticsRoutes.js
│   └── userBoardSettingsRoutes.js
├── services
│   ├── authService.js
│   ├── boardServices
│   │   ├── createBoard.js
│   │   ├── deleteBoard.js
│   │   ├── fetchBoards.js
│   │   ├── getBoardById.js
│   │   └── updateBoard.js
│   ├── chatbotService.js
│   ├── groupMemberService.js
│   ├── groupProductService.js
│   ├── groupService.js
│   ├── groupServices
│   │   └── groupService.js
│   ├── noteServices
│   │   └── noteService.js
│   ├── notificationService.js
│   ├── productServices
│   │   ├── createProduct.js
│   │   ├── deleteProduct.js
│   │   ├── fetchProducts.js
│   │   ├── getProductById.js
│   │   └── updateProduct.js
│   ├── statisticsService.js
│   └── userBoardSettingsService.js
├── testDb.js
└── utils
    └── errorHandler.js
```

## Installazione e Avvio

Seguire questi passaggi per configurare ed eseguire il progetto in locale dopo aver clonato il repository.

### Prerequisiti

Prima di iniziare, assicurati di avere installato sul tuo sistema:

- **Node.js**: Versione 16.x o superiore consigliata. Puoi scaricarlo da [nodejs.org](https://nodejs.org/). Questo include npm.
- **npm** (Node Package Manager): Viene installato automaticamente con Node.js.
  - _(Opzionale)_ **Yarn**: Se preferisci Yarn a npm, assicurati che sia installato (`npm install --global yarn`).
- **MariaDB (o MySQL compatibile)**: Assicurati di avere un server MariaDB o MySQL in esecuzione. Puoi scaricarlo da [mariadb.org](https://mariadb.org/) o [mysql.com](https://www.mysql.com/).
- **Git**: Per clonare il repository. Puoi scaricarlo da [git-scm.com](https://git-scm.com/).
- **Un Editor di Codice**: Come Visual Studio Code (VS Code), WebStorm, Sublime Text, ecc.

### 1. Clonare il Repository

Apri il tuo terminale o Git Bash e clona il repository nella cartella desiderata:

```bash
git clone https://github.com/Alexinfotech/LavagnettaFullstack.git
cd LavagnettaFullstack # O il nome della cartella dove hai clonato il repository (es. 'react')
```

### 2. Configurazione Database (MariaDB)

1.  **Avvia il tuo server MariaDB/MySQL.**
2.  **Connettiti al client del database.**
    Da terminale, puoi usare un comando come (sostituisci `tuo_utente_db` con il tuo utente DB, es. `root`):
    ```bash
    mysql -u tuo_utente_db -p
    ```
    Ti verrà chiesta la password.
3.  **Crea il database `lavagnetta`** se non esiste già:
    ```sql
    CREATE DATABASE IF NOT EXISTS lavagnetta CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    ```
4.  **(Consigliato) Crea un utente dedicato** per l'applicazione e concedigli i permessi:
    ```sql
    CREATE USER IF NOT EXISTS 'lavagnetta_user'@'localhost' IDENTIFIED BY 'tua_password_molto_sicura';
    GRANT ALL PRIVILEGES ON lavagnetta.* TO 'lavagnetta_user'@'localhost';
    FLUSH PRIVILEGES;
    ```
    _Ricorda di sostituire `'tua_password_molto_sicura'` con una password robusta e sicura._
5.  **Popola il database**: Esegui gli script SQL forniti nella sezione [Script SQL per la Creazione delle Tabelle](#script-sql-per-la-creazione-delle-tabelle) di questo README per creare tutte le tabelle necessarie. Puoi farlo direttamente dal client MariaDB/MySQL o importando un file `.sql` se fornito.

### 3. Setup Backend Node.js

1.  **Apri un terminale NELLA CARTELLA DEL BACKEND.**
    Dalla root del progetto clonato (es. `LavagnettaFullstack` o `react`), naviga in:
    ```bash
    cd lavagnetta-backend
    ```
2.  **Crea il file `.env`:**
    Copia il file `.env.example` (se fornito nel repository) in un nuovo file chiamato `.env`, oppure crea un file `.env` da zero.
    Modifica il file `.env` con le tue credenziali del database e altre configurazioni necessarie. Vedi la sezione [Variabili d'Ambiente](#variabili-dambiente) per un esempio di contenuto.
    **Importante:** Sostituisci i placeholder con i tuoi valori effettivi, specialmente `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` e `GEMINI_API_KEY`.
3.  **Installa le dipendenze del backend:**
    ```bash
    npm install
    ```
    _(Se preferisci Yarn e hai `yarn.lock` nel backend: `yarn install`)_

### 4. Setup Frontend React

1.  **Apri un ALTRO terminale (o riutilizza il primo) NELLA CARTELLA DEL FRONTEND.**
    Dalla root del progetto clonato, naviga in:
    ```bash
    cd lavagnetta
    ```
2.  **(Consigliato per Sviluppo Locale) Configura il proxy per le API:**
    Apri il file `lavagnetta/package.json` e assicurati che ci sia la seguente riga (o aggiungila) per inoltrare le richieste API al backend Node.js durante lo sviluppo:
    ```json
    {
      // ... altre configurazioni ...
      "proxy": "http://localhost:3001"
    }
    ```
    Questo assume che il backend Node.js giri sulla porta `3001`. Se non usi il proxy, dovrai configurare `REACT_APP_API_URL` nel file `lavagnetta/.env` (vedi sezione [Variabili d'Ambiente](#variabili-dambiente)).
3.  **Installa le dipendenze del frontend:**
    ```bash
    npm install
    ```
    _(Se preferisci Yarn e hai `yarn.lock` nel frontend: `yarn install`)_

### 5. Avvio dell'Applicazione

Devi avviare i due server (Backend Node.js e Frontend React) in terminali separati.

1.  **Avvia il Backend Node.js (che include il Chatbot):**

    - Nel terminale aperto in `LavagnettaFullstack/lavagnetta-backend/`:
      `bash
      npm start

    # Oppure, per sviluppo con auto-reload (se hai nodemon configurato nello script "dev"):

    # npm run dev

    `  Dovresti vedere un messaggio che indica che il server è in ascolto (es. su`http://localhost:3001`) e che il client Gemini è stato inizializzato (se la chiave API è corretta).

2.  **Avvia il Frontend React:**
    - Nel terminale aperto in `LavagnettaFullstack/lavagnetta/`:
      `bash
npm start
`
      Questo dovrebbe aprire automaticamente l'applicazione nel tuo browser predefinito, solitamente all'indirizzo `http://localhost:3000`.

Ora dovresti essere in grado di accedere e utilizzare l'applicazione Lavagnetta!

### Variabili d'Ambiente

È fondamentale configurare correttamente i file `.env` per il backend.

#### `lavagnetta-backend/.env` (Esempio)

# Configurazione Database

DB_HOST=localhost
DB_PORT=3306
DB_USER=lavagnetta_user
DB_PASSWORD=tua_password_molto_sicura # Sostituisci con la password scelta per l'utente DB
DB_NAME=lavagnetta

# Configurazione JWT

JWT_SECRET=la_tua_chiave_segreta_per_jwt_molto_lunga_e_complessa # CAMBIA QUESTA CHIAVE! Deve essere robusta.
JWT_EXPIRATION=8h # Durata del token (es. 8h, 1d, 30m)

# Porta del server Node.js

PORT=3001 # Porta su cui il backend Node.js sarà in ascolto

# Chiave API per Google Gemini (utilizzata dal chatbotService in Node.js)

GEMINI_API_KEY=LA_TUA_CHIAVE_API_VALIDA_PER_GOOGLE_GEMINI

#### `lavagnetta/.env` (Frontend React - Opzionale)

Questo file è necessario solo se **NON** utilizzi la configurazione `"proxy"` nel `package.json` del frontend per inoltrare le richieste API al backend durante lo sviluppo. Se usi il proxy, questo file non è strettamente necessario per `REACT_APP_API_URL`.

# URL base del backend Node.js (usare solo se NON si usa il proxy in package.json)

# REACT_APP_API_URL=http://localhost:3001/api

**Nota Bene:** Non committare MAI i tuoi file `.env` contenenti credenziali reali o chiavi API nel repository Git. Assicurati che `.env` (e varianti come `.env.local`) siano inclusi nel tuo file `.gitignore` globale. Fornisci invece file `.env.example` come template.

## Dipendenze del Progetto

### Frontend (React)

Elenco delle principali dipendenze di produzione e sviluppo (per una lista completa, fare riferimento al file `lavagnetta/package.json`):

- **Produzione (`dependencies`):**

  - `@babel/runtime@7.26.0`
  - `@fullcalendar/core@5.11.5`, `@fullcalendar/daygrid@5.11.5`, `@fullcalendar/interaction@5.11.5`, `@fullcalendar/react@5.11.5`
  - `axios@1.7.9`
  - `bootstrap@5.3.3`, `react-bootstrap@2.10.5`, `bootstrap-icons@1.11.3`
  - `chart.js@4.4.9`, `react-chartjs-2@5.3.0`
  - `clsx@2.1.1`
  - `cors@2.8.5`
  - `jwt-decode@3.1.2`
  - `prop-types@15.8.1`
  - `react@18.3.1`, `react-dom@18.3.1`
  - `react-hook-form@7.53.2`
  - `react-icons@5.4.0`
  - `react-is@18.3.1`
  - `react-router-dom@6.28.0`
  - `react-scripts@5.0.1`
  - `react-slick@0.30.2`, `slick-carousel@1.8.1`
  - `react-swipeable@7.0.2`
  - `react-toastify@10.0.6`
  - `web-vitals@2.1.4`
  - `workbox-core@7.3.0`, `workbox-expiration@7.3.0`, `workbox-precaching@7.3.0`, `workbox-routing@7.3.0`, `workbox-strategies@7.3.0`, `workbox-webpack-plugin@7.3.0`

- **Sviluppo (`devDependencies` - una selezione, verifica il `package.json`):**
  - `@testing-library/jest-dom@5.17.0`, `@testing-library/react@13.4.0`, `@testing-library/user-event@13.5.0`
  - `@babel/code-frame@7.26.2`, `@babel/plugin-proposal-private-property-in-object@7.21.11`
  - `cross-env@7.0.3`
  - `eslint@8.57.1`
  - `node-sass@7.0.3`
  - `prettier@3.4.2`

### Backend (Node.js)

Elenco delle principali dipendenze di produzione e sviluppo (per una lista completa, fare riferimento al file `lavagnetta-backend/package.json`):

- **Produzione (`dependencies`):**

  - `@google/generative-ai@0.24.0`
  - `axios@1.7.7`
  - `bad-words@4.0.0`
  - `bcryptjs@2.4.3` _(Nota: `bcrypt` è presente ma `bcryptjs` è la versione pura JS, spesso preferita per compatibilità)_
  - `body-parser@1.20.3`
  - `cors@2.8.5`
  - `dotenv@16.4.7`
  - `express@4.21.1`
  - `express-validator@7.2.0`
  - `jsonwebtoken@9.0.2`
  - `morgan@1.10.0`
  - `mysql2@3.11.5`
  - `openai@4.69.0` _(Nota: Se il chatbot usa esclusivamente Google Gemini, questa dipendenza potrebbe essere ridondante)._

- **Sviluppo (`devDependencies` - una selezione, verifica il `package.json`):**
  - `eslint@9.16.0`
  - `nodemon@3.1.7`
  - `prettier@3.4.2`

## Struttura del Database

Il progetto utilizza un database MariaDB. Di seguito l'elenco delle tabelle, la loro definizione completa come restituita da `SHOW CREATE TABLE`, e uno script SQL pulito per la loro creazione.

### Elenco Tabelle

L'applicazione utilizza le seguenti tabelle principali:

- `users`
- `groups`
- `boards`
- `notifications`
- `group_members`
- `interactions`
- `login_logs`
- `user_threads`
- `messages`
- `notes`
- `products`
- `sessions`
- `user_board_settings`

### Definizione Tabelle (SHOW CREATE TABLE)

Qui di seguito l'output esatto di `SHOW CREATE TABLE` per ogni tabella, utile per una replica precisa della struttura e delle sue impostazioni specifiche del motore di storage.

```sql
-- Output di: SHOW CREATE TABLE users;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `username` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE groups;
CREATE TABLE `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_groups_created_by` (`created_by`),
  CONSTRAINT `fk_groups_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE boards;
CREATE TABLE `boards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `background` varchar(255) DEFAULT 'default-background.jpg',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `group_id` int(11) DEFAULT NULL,
  `is_group_default` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_boards_user` (`user_id`),
  KEY `idx_group_boards` (`group_id`),
  CONSTRAINT `boards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boards_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boards_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE -- Nota: Questa FK è duplicata, una può essere rimossa.
) ENGINE=InnoDB AUTO_INCREMENT=184 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE NOTIFICATIONS;
CREATE TABLE `NOTIFICATIONS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE group_members;
CREATE TABLE `group_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('admin','level1','level2') DEFAULT 'level2',
  `invited_at` datetime DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `notification_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_group_user` (`group_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `fk_notification` (`notification_id`),
  KEY `idx_group_user_pending` (`group_id`,`user_id`,`accepted_at`),
  CONSTRAINT `fk_notification` FOREIGN KEY (`notification_id`) REFERENCES `NOTIFICATIONS` (`id`) ON DELETE SET NULL, -- Dovrebbe riferirsi a 'notifications' minuscolo se il nome tabella è case-sensitive
  CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE interactions;
CREATE TABLE `interactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `interaction` text NOT NULL,
  `response` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_interactions_user` (`user_id`),
  CONSTRAINT `fk_interactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1248 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE login_logs;
CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) -- Mancava ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE user_threads;
CREATE TABLE `user_threads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `thread_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `thread_id` (`thread_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_threads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE messages;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thread_id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `thread_id` (`thread_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`thread_id`) REFERENCES `user_threads` (`thread_id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=404 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE notes;
CREATE TABLE `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expense_amount` decimal(10,2) DEFAULT NULL COMMENT 'Importo spesa associato alla nota',
  `location` varchar(255) DEFAULT NULL COMMENT 'Luogo/negozio spesa associato alla nota',
  `item_count` int(10) unsigned DEFAULT NULL COMMENT 'Numero prodotti acquistati',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE products;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `board_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_purchased` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_modified_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `board_id` (`board_id`),
  KEY `fk_products_created_by` (`created_by`),
  KEY `fk_products_last_modified_by` (`last_modified_by`),
  CONSTRAINT `fk_products_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_products_last_modified_by` FOREIGN KEY (`last_modified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `boards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=577 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE sessions;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `last_access` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Output di: SHOW CREATE TABLE user_board_settings;
CREATE TABLE `user_board_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `board_id` int(11) NOT NULL,
  `background` varchar(255) DEFAULT 'default-background.jpg',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_board` (`user_id`,`board_id`),
  KEY `board_id` (`board_id`),
  CONSTRAINT `user_board_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_board_settings_ibfk_2` FOREIGN KEY (`board_id`) REFERENCES `boards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

````markdown
### Script SQL per la Creazione Pulita delle Tabelle

Per una maggiore leggibilità e per garantire la corretta creazione del database da zero, ecco gli script `CREATE TABLE` puliti. Si consiglia di eseguire questi script in sequenza dopo aver creato il database `lavagnetta`.

```sql
-- Tabella users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `username` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique_idx` (`email`) -- Assicura nome univoco per l'indice
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella groups
CREATE TABLE `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_groups_created_by_idx` (`created_by`),
  CONSTRAINT `fk_groups_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella boards
CREATE TABLE `boards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `background` varchar(255) DEFAULT 'default-background.jpg',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `group_id` int(11) DEFAULT NULL,
  `is_group_default` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_boards_user_idx` (`user_id`),
  KEY `idx_group_boards` (`group_id`),
  CONSTRAINT `boards_ibfk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boards_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella notifications (nome minuscolo per coerenza)
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_idx` (`user_id`),
  CONSTRAINT `notifications_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella group_members
CREATE TABLE `group_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('admin','level1','level2') DEFAULT 'level2',
  `invited_at` datetime DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `notification_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_group_user_idx` (`group_id`,`user_id`),
  KEY `group_members_user_id_idx` (`user_id`),
  KEY `group_members_notification_id_idx` (`notification_id`),
  KEY `idx_group_user_pending` (`group_id`,`user_id`,`accepted_at`),
  CONSTRAINT `group_members_fk_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE SET NULL,
  CONSTRAINT `group_members_fk_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_members_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella interactions
CREATE TABLE `interactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `interaction` text NOT NULL,
  `response` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `interactions_user_id_idx` (`user_id`),
  CONSTRAINT `interactions_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella login_logs
CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `login_logs_user_id_idx` (`user_id`),
  CONSTRAINT `login_logs_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella user_threads
CREATE TABLE `user_threads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `thread_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `thread_id_unique_idx` (`thread_id`),
  KEY `user_threads_user_id_idx` (`user_id`),
  CONSTRAINT `user_threads_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella messages
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `thread_id` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('user','assistant') NOT NULL,
  `content` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `messages_thread_id_idx` (`thread_id`),
  KEY `messages_user_id_idx` (`user_id`),
  CONSTRAINT `messages_fk_thread` FOREIGN KEY (`thread_id`) REFERENCES `user_threads` (`thread_id`) ON DELETE CASCADE,
  CONSTRAINT `messages_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella notes
CREATE TABLE `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expense_amount` decimal(10,2) DEFAULT NULL COMMENT 'Importo spesa associato alla nota',
  `location` varchar(255) DEFAULT NULL COMMENT 'Luogo/negozio spesa associato alla nota',
  `item_count` int(10) unsigned DEFAULT NULL COMMENT 'Numero prodotti acquistati',
  PRIMARY KEY (`id`),
  KEY `notes_user_id_idx` (`user_id`),
  CONSTRAINT `notes_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella products
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `board_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_purchased` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_modified_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `products_board_id_idx` (`board_id`),
  KEY `products_created_by_idx` (`created_by`),
  KEY `products_last_modified_by_idx` (`last_modified_by`),
  CONSTRAINT `products_fk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_fk_last_modified_by` FOREIGN KEY (`last_modified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_fk_board` FOREIGN KEY (`board_id`) REFERENCES `boards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella sessions
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `last_access` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_idx` (`user_id`),
  CONSTRAINT `sessions_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tabella user_board_settings
CREATE TABLE `user_board_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `board_id` int(11) NOT NULL,
  `background` varchar(255) DEFAULT 'default-background.jpg',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_board_idx` (`user_id`,`board_id`),
  KEY `user_board_settings_board_id_idx` (`board_id`),
  CONSTRAINT `user_board_settings_fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_board_settings_fk_board` FOREIGN KEY (`board_id`) REFERENCES `boards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```
````

_(Nota: Negli script puliti, ho rinominato alcuni indici e nomi di constraint per garantire l'unicità e la chiarezza, e normalizzato il nome della tabella `notifications` a minuscolo. Ho anche aggiunto `ON DELETE CASCADE` ad alcune FK per coerenza e per prevenire record orfani.)_

## Funzionalità Avanzate e Roadmap

Questo progetto pone le basi per numerose espansioni e funzionalità avanzate:

- **Invio Email per Nuovi Utenti**: Attualmente gli inviti sono per utenti esistenti. Si potrebbe implementare un sistema di invio email per invitare persone non ancora registrate, richiedendo la configurazione di un servizio email (es. SendGrid, Mailgun) e DNS di dominio.
- **Profilazione Utenti Avanzata**: Sfruttare i dati raccolti (prodotti nelle lavagnette, frequenza di spesa, tipi di ricette richieste al chatbot) per creare profili utente dettagliati, sempre nel rispetto della privacy e con il consenso dell'utente.
- **Integrazione Supermercati e Marketing**:
  - Il chatbot Ambrogio potrebbe, su richiesta di una ricetta, suggerire prodotti in offerta presso supermercati convenzionati o basati sulla località dell'utente (se fornita e consentita).
  - L'app potrebbe generare QR code sconto utilizzabili in cassa, basati sui prodotti inseriti nella lavagnetta, incentivando l'acquisto presso determinate catene.
  - Campagne marketing mirate (opt-in) basate sui dati di profilazione.
- **QR Code Omaggio e Gamification**: Introdurre meccanismi di ricompensa per l'utilizzo dell'app, il completamento di "sfide" di spesa, o per acquisti specifici.
- **Notifiche Push**: Oltre alle notifiche in-app, implementare notifiche push web/mobile per aggiornamenti importanti, promemoria per prodotti in scadenza (se si aggiunge tale funzionalità), o offerte speciali.
- **Internazionalizzazione (i18n)**: Supporto per multiple lingue nell'interfaccia utente e nelle risposte del chatbot.
- **Miglioramenti UX/UI**:
  - Drag and drop per riordinare i prodotti.
  - Temi personalizzabili dall'utente.
  - Suggerimenti prodotti più intelligenti basati sulla cronologia.
- **Test Unitari e di Integrazione**: Aggiungere una suite di test completa (es. Jest, React Testing Library per il frontend; Jest, Supertest per il backend Node.js) per garantire la stabilità e la qualità del codice.
- **Deployment e CI/CD**: Configurare pipeline di Integrazione Continua e Deployment Continuo (es. GitHub Actions, Jenkins, GitLab CI) per automatizzare test e rilasci.
- **Scalabilità del Backend**: Ottimizzare le query del database, implementare caching (es. Redis) per le richieste frequenti, e considerare architetture a microservizi se il traffico aumenta significativamente.
- **Accessibilità (a11y)**: Continuare a migliorare l'accessibilità dell'applicazione per utenti con disabilità, seguendo le linee guida WCAG.

## Contribuire

Le contribuzioni sono benvenute! Se desideri contribuire al progetto, per favore segui questi passaggi:

1.  **Forka il repository** su GitHub.
2.  **Clona la tua fork** in locale:
    ```bash
    git clone https://github.com/Alexinfotech/LavagnettaFullstack.git
    cd LavagnettaFullstack
    ```
3.  **Crea un nuovo branch** per la tua feature o bug fix:
    ```bash
    git checkout -b feature/nome-della-tua-feature # o fix/descrizione-del-bug
    ```
4.  **Apporta le tue modifiche** al codice.
5.  **Testa approfonditamente** le tue modifiche. Se aggiungi nuove funzionalità, considera di scrivere anche dei test.
6.  **Committa le tue modifiche** con messaggi di commit chiari e descrittivi:
    ```bash
    git add .
    git commit -m "feat: Aggiunta nuova fantastica feature"
    # oppure
    # git commit -m "fix: Corretto bug che causava X"
    ```
7.  **Pusha il tuo branch** sulla tua fork:
    ```bash
    git push origin feature/nome-della-tua-feature
    ```
8.  **Apri una Pull Request (PR)** dal tuo branch sulla tua fork verso il branch `main` (o il branch di sviluppo principale) del repository originale (`Alexinfotech/LavagnettaFullstack`).
    - Nella descrizione della PR, spiega chiaramente cosa fa la tua modifica e perché è necessaria.
    - Se la PR risolve una issue esistente, menzionala (es. "Closes #123").

Si prega di seguire le convenzioni di codifica esistenti nel progetto e di mantenere il codice pulito e leggibile.

## Licenza

Questo progetto è rilasciato sotto la Licenza GNU GENERAL PUBLIC LICENSE. Vedi il file `LICENSE` nel repository per maggiori dettagli.
