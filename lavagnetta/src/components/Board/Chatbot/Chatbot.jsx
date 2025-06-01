// src/components/Board/Chatbot/Chatbot.jsx
// v17 - Ritorno a logica v12 + Integrazione corretta Selettore Ingredienti
import React, { useState, useEffect, useRef, useCallback } from "react";
import ChatbotService from "../../../services/ChatbotService"; // Verifica percorso
import "./Chatbot.css"; // Assicurati CSS aggiornato

import { FaPaperPlane, FaPaperclip, FaSmile, FaTimes } from "react-icons/fa";

const Chatbot = ({ isOpen, onClose, boardContext, onAddItems }) => {
  // Hooks (Stati come nella v12)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Ciao! Sono Ambrogio, il tuo aiutante in cucina. Chiedimi una ricetta e ti aiuterò con gli ingredienti! Ti posso aiutare anche con ricette svuota frigo. In cosa ti posso essere utile? ",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [chatbotVisible, setChatbotVisible] = useState(false); // Finestra chat è visibile?
  const [isHolding, setIsHolding] = useState(false); // Per animazione bottone
  const [holdTimeout, setHoldTimeout] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false); // Per animazione apertura
  const [isTyping, setIsTyping] = useState(false);
  const [currentGif, setCurrentGif] = useState(null);
  const [inactivityTimeout, setInactivityTimeout] = useState(null);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  // Stato per ingredienti (come v12, stato separato)
  const [selectableIngredients, setSelectableIngredients] = useState(null); // { messageIndex: number, items: string[] }
  // Stato per checkbox
  const [selectedIngredients, setSelectedIngredients] = useState({});

  // URLs GIF
  const DEFAULT_GIF =
    "https://tenor.com/view/o2-o2robot-o2ad-bubl-o2bubl-gif-18485862.gif";
  const SENDING_GIF =
    "https://tenor.com/it/view/o2-o2robot-o2ad-bubl-o2bubl-gif-18419086.gif";
  const INACTIVITY_GIF =
    "https://tenor.com/it/view/o2-bubl-robot-blue-bubble-gif-23294584.gif";

  // --- Effetti ---

  // Chiude la finestra interna se la prop isOpen diventa false
  useEffect(() => {
    if (!isOpen && chatbotVisible) {
      console.log(
        "[Chatbot.jsx v17] Rilevato isOpen=false, chiudo finestra interna."
      );
      setChatbotVisible(false);
      // Reset stati legati alla finestra aperta
      setCurrentGif(null);
      setSelectableIngredients(null);
      setSelectedIngredients({});
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      setIsTyping(false); // Ferma eventuale indicatore typing
    }
    // Non impostare GIF qui per non interferire con l'animazione hold
  }, [isOpen, chatbotVisible, inactivityTimeout]); // Aggiunte dipendenze

  // Pulizia altri timers
  useEffect(() => {
    return () => {
      if (holdTimeout) clearTimeout(holdTimeout);
      // Il timer di inattività viene gestito sopra e in resetInactivityTimer
    };
  }, [holdTimeout]);

  // Scroll e Focus (come v12/v15)
  const scrollToBottom = useCallback(() => {
    if (chatbotVisible && chatMessagesRef.current) {
      requestAnimationFrame(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop =
            chatMessagesRef.current.scrollHeight;
        }
      });
    }
  }, [chatbotVisible]);

  useEffect(() => {
    scrollToBottom();
    if (chatbotVisible && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 110);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping, chatbotVisible, scrollToBottom]);

  // --- Funzioni Core Chat ---

  // Timer inattività (come v12/v15)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    const timeout = setTimeout(() => {
      if (chatbotVisible) setCurrentGif(INACTIVITY_GIF);
    }, 15000);
    setInactivityTimeout(timeout);
  }, [inactivityTimeout, chatbotVisible]); // Aggiunta dipendenza

  // Apre la FINESTRA chat (attivata da hold/click bottone flottante)
  const openChatWindow = useCallback(() => {
    if (chatbotVisible) return;
    console.log("[Chatbot.jsx v17] Apertura finestra chat...");
    setChatbotVisible(true);
    setCurrentGif(DEFAULT_GIF); // Imposta GIF header
    resetInactivityTimer(); // Avvia timer
    setTimeout(() => setIsAnimating(false), 600); // Ferma animazione apertura
  }, [chatbotVisible, resetInactivityTimer]);

  // --- Funzioni Attivazione/Animazione Bottone Flottante (come v12) ---
  const startHold = useCallback(() => {
    if (chatbotVisible) return;
    setIsHolding(true);
    setIsAnimating(true);
    const timeout = setTimeout(() => {
      openChatWindow();
      setIsHolding(false);
    }, 1500);
    setHoldTimeout(timeout);
  }, [chatbotVisible, openChatWindow]);

  const endHold = useCallback(() => {
    if (holdTimeout) clearTimeout(holdTimeout);
    setIsHolding(false);
    if (!chatbotVisible) {
      openChatWindow();
      setTimeout(() => setIsAnimating(false), 100);
    }
  }, [holdTimeout, chatbotVisible, openChatWindow]);

  const cancelHold = useCallback(() => {
    if (holdTimeout) clearTimeout(holdTimeout);
    setIsHolding(false);
    if (!chatbotVisible) setIsAnimating(false);
  }, [holdTimeout, chatbotVisible]);

  // Chiusura finestra chat DAL bottone X interno
  const handleInternalCloseClick = useCallback(() => {
    console.log("[Chatbot.jsx v17] Bottone chiusura interna cliccato.");
    setChatbotVisible(false); // Nasconde finestra
    // Reset stati finestra
    setCurrentGif(null);
    setSelectableIngredients(null);
    setSelectedIngredients({});
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    setIsTyping(false);
    // Notifica il parent che DEVE chiudere (impostare isOpen a false)
    if (typeof onClose === "function") {
      onClose();
    }
  }, [inactivityTimeout, onClose]); // Rimossa dipendenza chatbotVisible per evitare problemi

  // --- Funzione Invio Messaggio (Logica v12 + Estrazione Ingredienti) ---
  const sendMessage = useCallback(() => {
    const trimmedInput = userInput.trim();
    if (trimmedInput === "") return;

    console.log("[Chatbot.jsx v17] Preparazione invio:", trimmedInput);
    const userMessage = { role: "user", content: trimmedInput };

    // Resetta stato ingredienti precedente
    if (selectableIngredients) {
      setSelectableIngredients(null);
      setSelectedIngredients({});
    }

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserInput("");

    setCurrentGif(SENDING_GIF);
    resetInactivityTimer();
    setIsTyping(true);

    console.log(
      "[Chatbot.jsx v17] Chiamata ChatbotService.interact:",
      trimmedInput
    );
    ChatbotService.interact(trimmedInput) // SOLO MESSAGGIO
      .then((response) => {
        // response è l'oggetto JSON dal backend v12
        setIsTyping(false);

        // Estrai i dati dalla risposta JSON strutturata
        const assistantResponseText =
          response?.response_text || "Errore: Risposta non valida.";
        // Estrai l'array di ingredienti, assicurati sia un array o null
        const extractedIngredients =
          Array.isArray(response?.ingredients) &&
          response.ingredients.length > 0
            ? response.ingredients
            : null;
        // Puoi usare anche gli altri flag se vuoi: const isRecipe = response?.is_recipe === true;

        console.log("[Chatbot.jsx v17] Risposta Backend:", response);
        if (extractedIngredients)
          console.log(
            "[Chatbot.jsx v17] Ingredienti estratti:",
            extractedIngredients
          );
        else
          console.log(
            "[Chatbot.jsx v17] Nessun ingrediente nella risposta strutturata."
          );

        // Crea l'oggetto messaggio assistente
        const assistantMessage = {
          role: "assistant",
          content: assistantResponseText,
        };
        // Calcola indice PRIMA di aggiornare lo stato messages
        const assistantMessageIndex = messages.length + 1; // Indice *dopo* il messaggio user

        setMessages((prevMessages) => [...prevMessages, assistantMessage]);

        // Imposta lo stato SEPARATO per gli ingredienti se estratti
        if (extractedIngredients) {
          setSelectableIngredients({
            messageIndex: assistantMessageIndex,
            items: extractedIngredients,
          });
          const initialSelection = extractedIngredients.reduce((acc, item) => {
            acc[item] = true;
            return acc;
          }, {});
          setSelectedIngredients(initialSelection);
          console.log(
            "[Chatbot.jsx v17] Stato ingredienti impostato per indice:",
            assistantMessageIndex
          );
        } else {
          setSelectableIngredients(null); // Assicura sia null se non ci sono
        }

        setCurrentGif(DEFAULT_GIF);
        resetInactivityTimer();
      })
      .catch((error) => {
        console.error(
          "[Chatbot.jsx v17] Errore backend:",
          error.response?.data?.error || error.message || error
        );
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Oops! Comunicazione fallita." },
        ]);
        setCurrentGif(DEFAULT_GIF);
        resetInactivityTimer();
      });
  }, [userInput, messages, resetInactivityTimer, selectableIngredients]); // Aggiunta dipendenza selectableIngredients

  // Handler tasto Invio
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Funzioni Ingredienti (invariate) ---
  const handleIngredientToggle = useCallback((ingredientName) => {
    setSelectedIngredients((prev) => ({
      ...prev,
      [ingredientName]: !prev[ingredientName],
    }));
  }, []);
  const handleAddSelectedIngredients = useCallback(() => {
    const itemsToAdd = Object.entries(selectedIngredients)
      .filter(([_, s]) => s)
      .map(([n]) => n);
    if (itemsToAdd.length > 0) {
      if (typeof onAddItems === "function" && boardContext) {
        console.log(
          "[Chatbot.jsx v17] Chiamata onAddItems:",
          itemsToAdd,
          "Board:",
          boardContext?.id
        );
        onAddItems(itemsToAdd, boardContext);
        setSelectableIngredients(null); // Resetta dopo aggiunta
        setSelectedIngredients({});
        // Aggiungi messaggio conferma
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Ho aggiunto ${itemsToAdd.length} ingredient${itemsToAdd.length > 1 ? "i" : "e"} alla lavagna!`,
          },
        ]);
      } else {
        console.error("[Chatbot.jsx v17] onAddItems o boardContext mancante!");
      }
    } else {
      console.log("[Chatbot.jsx v17] Nessun ingrediente selezionato.");
    }
  }, [selectedIngredients, onAddItems, boardContext]);

  // --- JSX Return (come v12 + rendering selettore v15) ---
  return (
    <div
      className={`chatbot-wrapper ${isOpen ? "visible" : ""} ${chatbotVisible ? "chat-open" : ""} ${isHolding ? "holding" : ""} ${isAnimating ? "animating" : ""}`}
      aria-live="polite"
      aria-hidden={!isOpen && !chatbotVisible}
    >
      {/* Bottone Flottante */}
      {isOpen && !chatbotVisible && !isAnimating && (
        <button
          className="floating-chatbot-button"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          aria-label="Apri Chat Ambrogio"
          title="Apri Chat Ambrogio"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            width="28px"
            height="28px"
          >
            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
          </svg>
        </button>
      )}
      {/* Animazione Apertura */}
      {isAnimating && (
        <div className="animation-container">
          {" "}
          <img
            src="https://tenor.com/view/o2-o2robot-o2ad-bubl-o2bubl-gif-18485851.gif"
            alt="Apertura Chat..."
            className="opening-animation"
          />{" "}
        </div>
      )}

      {/* Finestra Chat */}
      {chatbotVisible && (
        <div className="chat-container">
          {/* Header */}
          <div className="chat-header">
            <div className="header-left">
              {" "}
              <div className="header-gif-container">
                {currentGif && (
                  <img src={currentGif} alt="Ambrogio" className="header-gif" />
                )}
              </div>{" "}
              <div className="header-info">
                <h4>Ambrogio</h4>
                <span className="status-text">Online</span>
              </div>{" "}
            </div>
            {/* Usa handleInternalCloseClick per il bottone X */}
            <button
              className="close-button"
              onClick={handleInternalCloseClick}
              aria-label="Chiudi Chat"
            >
              <FaTimes />
            </button>
          </div>

          {/* Area Messaggi */}
          <div
            className="chat-messages"
            ref={chatMessagesRef}
            aria-live="polite"
          >
            {messages.map((message, index) => {
              // Usa stato SEPARATO selectableIngredients per decidere se mostrare
              const shouldShowIngredients =
                selectableIngredients?.messageIndex === index;
              const isSystemMessage = message.role === "system";
              const messageKey = `msg-${index}-${message.role}`;

              return (
                <div
                  key={messageKey}
                  className={`message-wrapper ${isSystemMessage ? "system" : message.role}`}
                >
                  {!isSystemMessage ? (
                    <div
                      className={`message ${message.role === "user" ? "user-message" : "assistant-message"}`}
                    >
                      <div
                        className="message-content"
                        dangerouslySetInnerHTML={{
                          __html: message.content.replace(
                            /\*(.*?)\*/g,
                            "<strong>$1</strong>"
                          ),
                        }}
                      />
                      {/* --- Rendering Selettore Ingredienti --- */}
                      {shouldShowIngredients && ( // Condizione basata su stato separato
                        <div className="ingredient-selector">
                          <h5>Ingredienti da aggiungere:</h5>
                          <ul className="ingredient-list">
                            {selectableIngredients.items.map(
                              (
                                ingredient,
                                i // Itera su stato separato
                              ) => (
                                <li key={`${messageKey}-ing-${i}`}>
                                  <label className="ingredient-label">
                                    <input
                                      type="checkbox"
                                      className="ingredient-checkbox"
                                      checked={
                                        !!selectedIngredients[ingredient]
                                      }
                                      onChange={() =>
                                        handleIngredientToggle(ingredient)
                                      }
                                      aria-label={ingredient}
                                    />
                                    <span className="ingredient-name">
                                      {ingredient}
                                    </span>
                                  </label>
                                </li>
                              )
                            )}
                          </ul>
                          <button
                            className="add-ingredients-button"
                            onClick={handleAddSelectedIngredients}
                            disabled={
                              !Object.values(selectedIngredients).some(Boolean)
                            }
                          >
                            Aggiungi Selezionati
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="system-message-content">
                      {message.content}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Indicatore Typing */}
            {isTyping && (
              <div className="message-wrapper assistant">
                {" "}
                <div className="message assistant-message typing-indicator">
                  {" "}
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>{" "}
                </div>{" "}
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="chat-input-bar">
            <button
              className="icon-button emoji-button"
              aria-label="Emoji"
              title="Emoji"
            >
              <FaSmile />
            </button>
            <button
              className="icon-button attach-button"
              aria-label="Allega"
              title="Allega"
            >
              <FaPaperclip />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              placeholder="Scrivi un messaggio..."
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              aria-label="Messaggio da inviare"
            />
            <button
              className="send-button"
              onClick={sendMessage}
              aria-label="Invia Messaggio"
              title="Invia"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
