require('dotenv').config();
const db = require('./src/config/db');
const {
    createThread,
    sendMessage,
    createRun,
    getRunStatus,
    getMessages,
    isDuplicateResponse
} = require('./src/services/assistantService');

// Funzione per stampare i messaggi nel thread
const printMessages = (messages) => {
    console.log('--- Messaggi nel Thread ---');
    messages.reverse().forEach((msg) => {
        const content = msg.content.map(c => c.text ? c.text.value : '').join(' ');
        console.log(`${msg.role}: ${content}`);
    });
    console.log('----------------------------');
};

// Funzione per processare una singola domanda e ottenere una risposta
const processSingleRun = async (threadId, messageContent) => {
    // Invia il messaggio
    await sendMessage(threadId, 'user', messageContent);
    console.log(`Messaggio inviato: ${messageContent}`);

    // Crea un run per processare la risposta
    let run = await createRun(threadId);
    console.log('Run creato:', run.id);

    // Controlla lo stato del run e attende il completamento
    let runStatus = await getRunStatus(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 10;

    // Attendi che il run sia completato o fermato, con un limite di tentativi
    while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa di 1 secondo
        runStatus = await getRunStatus(threadId, run.id);
        attempts++;
    }

    if (runStatus.status === 'completed') {
        const updatedMessagesData = await getMessages(threadId);
        const updatedMessages = updatedMessagesData.data;

        // Mostra i messaggi nel thread
        printMessages(updatedMessages);

        // Filtra e trova l'ultimo messaggio dell'assistente
        const assistantMessages = updatedMessages.filter(msg => msg.role === 'assistant');

        // Verifica se ci sono risposte duplicate per evitare cicli
        if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

            if (lastAssistantMessage.content[0].text.value === messageContent) {
                console.log('Risposta duplicata rilevata, ignorando...');
                return null;
            }

            console.log('Risposta dell\'assistente:', lastAssistantMessage.content[0].text.value);
            return lastAssistantMessage.content[0].text.value;
        } else {
            console.log('Nessuna risposta valida dall\'assistente.');
        }
    } else {
        console.log('Errore: il run non è stato completato.');
    }
};

const test = async () => {
    try {
        const userId = 1; // Assicurati che questo utente esista nel tuo database
        console.log('ID utente:', userId);

        // Controlla se l'utente esiste
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            console.log(`L'utente con ID ${userId} non esiste. Creane uno prima di procedere.`);
            return;
        }

        let threadId;

        // Verifica se esiste già un thread per questo utente nel database
        const [rows] = await db.execute('SELECT thread_id FROM user_threads WHERE user_id = ?', [userId]);

        if (rows.length > 0) {
            threadId = rows[0].thread_id;
            console.log('Thread esistente trovato:', threadId);
        } else {
            // Crea un nuovo thread e associa l'ID all'utente
            const thread = await createThread();
            threadId = thread.id;
            console.log('Nuovo thread creato:', threadId);

            // Inserisci il mapping nel database
            await db.execute('INSERT INTO user_threads (user_id, thread_id) VALUES (?, ?)', [userId, threadId]);
        }

        // Fase 1: Invio della prima domanda
        const firstResponse = await processSingleRun(threadId, 'Vorrei una ricetta per il tiramisù.');
        console.log('Prima risposta:', firstResponse);

        // Fase 2: Invio della seconda domanda
        const secondResponse = await processSingleRun(threadId, 'Per 4 persone.');
        console.log('Seconda risposta:', secondResponse);

    } catch (error) {
        console.error('Errore durante il test:', error);
    } finally {
        db.end(); // Chiude la connessione al database
    }
};

test();
