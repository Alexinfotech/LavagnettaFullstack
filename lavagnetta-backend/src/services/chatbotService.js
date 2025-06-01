// src/services/chatbotService.js
// v20 - Corregge DEFINITIVAMENTE errore sintassi in SYSTEM_INSTRUCTION
const pool = require('../config/db');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// --- Inizializzazione Filtro Parolacce ---
let customFilterInstance = null;
(async () => {
    try {
        const badWordsModule = await import('bad-words');
        let FilterClass = null;
        if (badWordsModule.Filter && typeof badWordsModule.Filter === 'function') FilterClass = badWordsModule.Filter;
        else if (badWordsModule.default && typeof badWordsModule.default === 'function') FilterClass = badWordsModule.default;
        else if (typeof badWordsModule === 'function') FilterClass = badWordsModule;

        if (FilterClass) {
            customFilterInstance = new FilterClass();
            console.log("[ChatbotService] Filtro parolacce ISTANZIATO con successo.");
        } else {
            console.error("[ChatbotService] ERRORE: Costruttore 'bad-words' non trovato. Filtro disattivato.");
        }
    } catch (e) {
        console.error("[ChatbotService] ERRORE CRITICO caricamento 'bad-words'. Filtro non attivo.", e);
        customFilterInstance = null;
    }
})();

// --- Inizializzazione Cliente Gemini ---
let model = null;
const MAX_HISTORY_TURNS = 6;
// --- CORREZIONE SINTASSI ISTRUZIONE ---
const SYSTEM_INSTRUCTION = `Sei "Ambrogio", assistente culinario AI per l'app Lavagnetta.
Rispondi SEMPRE e SOLO in formato JSON valido. NON DEVI MAI includere marcatori di blocco codice come tre backtick json o tre backtick all'inizio o alla fine della tua risposta.
Il JSON DEVE avere questa struttura ESATTA:
{
  "response_text": "Testo colloquiale e amichevole della tua risposta...",
  "recipe_name": "Nome Ricetta (stringa o null)",
  "ingredients": ["Ingrediente 1", "Ingrediente 2", ...] | null,
  "instructions": "Istruzioni preparazione (stringa o null)",
  "is_recipe": true | false,
  "is_off_topic": true | false
}
Descrizione campi:
- response_text: La tua risposta principale discorsiva. Introduci ricette qui. Gestisci saluti e risposte fuori tema qui. Usa '[Nome Utente]' come placeholder per il nome.
- recipe_name: Nome della ricetta se ne fornisci una.
- ingredients: ARRAY di stringhe (ogni ingrediente separato, es. "Farina 00: 200g"). SOLO se is_recipe è true. Altrimenti null.
- instructions: Stringa con le istruzioni. SOLO se is_recipe è true. Altrimenti null.
- is_recipe: true se la risposta contiene una ricetta completa, false altrimenti.
- is_off_topic: true se la richiesta è fuori tema o inappropriata, false altrimenti.

Regole Comportamentali OBBLIGATORIE:
- Saluti (ciao, buongiorno...): Imposta is_off_topic: false, is_recipe: false. In response_text saluta cordialmente (es. "Ciao [Nome Utente]!...") e chiedi come aiutare in cucina.
- Richieste Fuori Tema (politica, storia, programmazione, domande su di te come AI...): Imposta is_off_topic: true, is_recipe: false. In response_text spiega gentilmente che tratti solo cucina (es. "Mi dispiace [Nome Utente], ma il mio campo è solo la cucina...").
- Richieste Culinarie: Imposta is_recipe: true/false a seconda se fornisci una ricetta completa o solo informazioni. Popola gli altri campi JSON di conseguenza. Se fornisci ricetta, popola ingredients e instructions.
- Linguaggio: NON usare MAI linguaggio volgare/offensivo.
- ID Utente: NON menzionare MAI l'ID numerico.
- Tono: Mantieni un tono amichevole, educato, positivo e utile.`;
// --- FINE CORREZIONE SINTASSI ---

try {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY mancante.");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
        generationConfig: { responseMimeType: "application/json" }, // Forza JSON!
        systemInstruction: SYSTEM_INSTRUCTION, // Usa istruzione corretta
    });
    console.log("[ChatbotService] Cliente Gemini inizializzato (JSON richiesto v20).");
} catch (initError) {
    console.error("[ChatbotService] ERRORE CRITICO inizializzazione Gemini:", initError.message);
    model = null;
}


class ChatbotService {

    async _getUsername(userId, conn) {
        if (!userId) return `Utente`;
        const connection = conn || pool;
        try {
            const [rows] = await connection.execute('SELECT username FROM users WHERE id = ?', [userId]);
            return rows[0]?.username || `Utente`; // Rimosso ID per sicurezza
        } catch (e) {
            console.error(`[ChatbotService] Errore recupero username per ID ${userId}:`, e.message);
            return `Utente`;
        }
    }


    // Crea JSON di fallback
    _createFallbackResponse(text, isOffTopic = false, username = "Utente") {
        const personalizedText = text.replace(/\[Nome Utente\]/g, username);
        console.log(`[ChatbotService] Creazione Fallback Response: ${personalizedText}`);
        return {
            response_text: personalizedText, recipe_name: null, ingredients: null,
            instructions: null, is_recipe: false, is_off_topic: isOffTopic
        };
    }


    async getResponse(userId, userMessage) {
        const username = await this._getUsername(userId);
        const userIdentifierLog = `${username}(ID:${userId})`; // Manteniamo ID per log interno
        console.log(`\n--- [ChatbotService v20] Inizio getResponse per ${userIdentifierLog} ---`);
        console.log(`[ChatbotService v20] Messaggio ricevuto: "${userMessage}"`);

        // --- 0. Controlli Iniziali & Filtro Input & Saluti ---
        if (!model) { const fb = this._createFallbackResponse("Servizio chatbot non disponibile.", true, username); await this.saveInteraction(userId, userMessage, JSON.stringify(fb)); return fb; }
        if (!userId || typeof userMessage !== 'string' || userMessage.trim() === '') { return this._createFallbackResponse("Input non valido.", true, username); }
        const trimmedMessage = userMessage.trim();
        if (customFilterInstance && typeof customFilterInstance.isProfane === 'function') { if (customFilterInstance.isProfane(trimmedMessage)) { const fb = this._createFallbackResponse("Linguaggio inappropriato.", true, username); await this.saveInteraction(userId, trimmedMessage, JSON.stringify(fb)); return fb; } }
        const lowerCaseMessage = trimmedMessage.toLowerCase();
        const greetings = ["ciao", "salve", "buongiorno", "buonasera", "ehi", "hey", "yo"];
        if (greetings.includes(lowerCaseMessage)) { const fb = this._createFallbackResponse(`Ciao ${username}! Sono Ambrogio...`, false, username); await this.saveInteraction(userId, trimmedMessage, JSON.stringify(fb)); return fb; }

        // --- 3. Recupero Cronologia ---
        console.log(`[ChatbotService v20] ${userIdentifierLog}: Procedo con chiamata AI.`);
        let historyForGemini = [];
        // ... (Logica recupero storia v11 - CORRETTA) ...

        // --- 4. Chiamata a Gemini ---
        let finalResponseObject = null;
        let rawGeminiTextOutput = null;
        let responseToSaveInDb = null;

        try {
            const chat = model.startChat({ history: historyForGemini });
            console.log(`[ChatbotService v20] ${userIdentifierLog}: Invio a Gemini: "${trimmedMessage}"`);
            const result = await chat.sendMessage(trimmedMessage);
            const response = result.response;
            rawGeminiTextOutput = response.text();
            console.log(`[ChatbotService v20] ${userIdentifierLog}: Risposta GREZZA da Gemini:\n${rawGeminiTextOutput || 'N/D'}`);

            if (response.promptFeedback?.blockReason) { /* ... fallback sicurezza ... */ }
            else if (rawGeminiTextOutput) {
                try {
                    const parsedGeminiJson = JSON.parse(rawGeminiTextOutput);
                    console.log(`[ChatbotService v20] ${userIdentifierLog}: JSON da Gemini parsato.`);

                    // Ricostruzione oggetto (come v19)
                    finalResponseObject = {
                        recipe_name: parsedGeminiJson.title || parsedGeminiJson.recipe_name || null,
                        ingredients: Array.isArray(parsedGeminiJson.ingredients) ? parsedGeminiJson.ingredients : null,
                        instructions: parsedGeminiJson.instructions || null,
                        is_recipe: !!(Array.isArray(parsedGeminiJson.ingredients) && parsedGeminiJson.ingredients.length > 0 && parsedGeminiJson.instructions),
                        response_text: "", // Verrà costruito sotto
                        is_off_topic: parsedGeminiJson.is_off_topic === true
                    };

                    // Costruzione response_text (come v19)
                    if (finalResponseObject.is_recipe && finalResponseObject.recipe_name) {
                        finalResponseObject.response_text = `Certamente ${username}! Ecco la ricetta per ${finalResponseObject.recipe_name}:`;
                        if (typeof finalResponseObject.instructions === 'string') {
                            finalResponseObject.response_text += `\n\nIstruzioni:\n${finalResponseObject.instructions}`;
                        }
                    } else if (parsedGeminiJson.response_text) {
                        finalResponseObject.response_text = parsedGeminiJson.response_text.replace(/\[Nome Utente\]/g, username);
                    } else { /* ... fallback response_text ... */ }

                    // Filtro parolacce output (come v19)
                    if (customFilterInstance && typeof customFilterInstance.isProfane === 'function') { /* ... */ }

                } catch (parseError) { /* ... gestione errore parsing ... */ }
            } else { /* ... gestione risposta vuota ... */ }
        } catch (geminiError) { /* ... gestione errore API ... */ }

        if (!finalResponseObject) {
            finalResponseObject = this._createFallbackResponse("Errore interno imprevisto.", true, username);
        }

        // --- 5. Salva interazione e restituisci ---
        responseToSaveInDb = JSON.stringify(finalResponseObject);
        await this.saveInteraction(userId, trimmedMessage, responseToSaveInDb);
        console.log(`--- [ChatbotService v20] Fine getResponse per ${userIdentifierLog} ---`);
        return finalResponseObject;
    }

    async saveInteraction(userId, userInteraction, assistantJsonResponseString) { /* ... come v18 ... */ }
}

module.exports = new ChatbotService();