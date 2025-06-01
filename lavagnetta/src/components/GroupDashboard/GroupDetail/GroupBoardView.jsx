/* ==== src/components/GroupDashboard/GroupDetail/GroupBoardView.jsx (vXX+17 + Modifiche Chatbot Batch Add) ==== */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import {
  Modal,
  Button,
  Form,
  Spinner as BootstrapSpinner,
} from "react-bootstrap";
import { useLayout } from "../../../contexts/LayoutContext";
import { useGroup } from "../../../contexts/GroupContext";
import { toast } from "react-toastify";
import api from "../../../services/api"; // <-- VERIFICATO: Import api presente
import Board from "../../Board/Board"; // Importa Board
import GroupHeader from "./GroupHeader.jsx"; // Importa GroupHeader
import Chatbot from "../../Board/Chatbot/Chatbot"; // <--- IMPORTA CHATBOT
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";
import { FaPlus } from "react-icons/fa";
// import { addItem as addItemAction } from "../../Board/actions/addItem"; // <-- MANTENUTO PER ORA (per FAB)
import { addItem as addItemAction } from "../../Board/actions/addItem";

import "./GroupBoardView.css";
import "../../Board/Board.css"; // Assumi che ci siano stili comuni
import "../../Board/Chatbot/Chatbot.css"; // Importa stili Chatbot

const POLLING_INTERVAL = 15000; // 15 secondi

const GroupBoardView = () => {
  // --- Hooks ---
  const { groupId, boardId } = useParams();
  const navigate = useNavigate();
  const { isSubHeaderHidden, hideSubHeader, showSubHeader } = useLayout();
  const {
    currentGroup,
    boards: contextBoards,
    loading: groupLoading,
    fetchGroupDetails,
  } = useGroup();

  // --- Stati Locali ---
  const [currentBoardData, setCurrentBoardData] = useState(null);
  const [siblingBoards, setSiblingBoards] = useState([]);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemNameModal, setNewItemNameModal] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false); // <--- STATO PER CHATBOT

  // --- Stati e Refs per Polling e Notifiche ---
  const [hasUpdates, setHasUpdates] = useState(false);
  const pollingIntervalId = useRef(null);
  const pollingSinceTimestamp = useRef(null);
  const isDocumentVisible = useRef(!document.hidden);
  const lastOwnActionTimestamp = useRef(null);

  // --- Refs UI ---
  const modalInputRef = useRef(null);

  // --- Funzioni Helper ---

  // Funzione checkUpdates (invariata)
  const checkUpdates = useCallback(async () => {
    const numericGroupId = parseInt(groupId);
    const numericBoardId = parseInt(boardId);
    const sinceTs = pollingSinceTimestamp.current;
    // console.log(`[Polling Check - ActionTS] Stato: Visible=${isDocumentVisible.current}, HasUpdates=${hasUpdates}, Since=${sinceTs}, LastActionTS=${lastOwnActionTimestamp.current}`);
    if (
      !sinceTs ||
      hasUpdates ||
      !numericGroupId ||
      !numericBoardId ||
      !isDocumentVisible.current
    ) {
      // console.log("[Polling Check - ActionTS] Check skipped.");
      return;
    }
    try {
      // console.log(`[Polling Check - ActionTS] Eseguo chiamata /status since:${sinceTs}`);
      const response = await api.get(
        `/auth/groups/${numericGroupId}/boards/${numericBoardId}/status?since=${sinceTs}`
      );
      const responseData = response.data;
      const serverLastUpdateTs = responseData?.lastUpdateTimestamp;
      const serverHasUpdates = responseData?.hasUpdates === true;
      // console.log(`[Polling Check - ActionTS] Risposta API:`, responseData);
      pollingSinceTimestamp.current = serverLastUpdateTs || Date.now();
      // console.log(`[Polling Check - ActionTS] Timestamp 'since' aggiornato a: ${pollingSinceTimestamp.current}`);
      let shouldShowUpdate = false;
      if (serverHasUpdates && serverLastUpdateTs) {
        if (serverLastUpdateTs !== lastOwnActionTimestamp.current) {
          // console.log(`[Polling Check - ActionTS] *** Aggiornamento Esterno Verificato! *** (ServerTS: ${serverLastUpdateTs} !== LastActionTS: ${lastOwnActionTimestamp.current}). Imposto hasUpdates=true`);
          shouldShowUpdate = true;
        } else {
          // console.log(`[Polling Check - ActionTS] Aggiornamento rilevato MA corrisponde all'azione locale (ServerTS: ${serverLastUpdateTs} === LastActionTS: ${lastOwnActionTimestamp.current}). Auto-notifica evitata.`);
        }
        lastOwnActionTimestamp.current = null;
      } else {
        // console.log(`[Polling Check - ActionTS] Nessun aggiornamento rilevato o timestamp server mancante.`);
        lastOwnActionTimestamp.current = null;
      }
      if (shouldShowUpdate) {
        setHasUpdates(true);
        if (pollingIntervalId.current) {
          clearInterval(pollingIntervalId.current);
          pollingIntervalId.current = null;
          // console.log("[Polling Check - ActionTS] Intervallo fermato a causa di hasUpdates=true.");
        }
      }
    } catch (pollError) {
      console.warn(
        `[Polling Check - ActionTS] Errore controllo status:`,
        pollError.response?.data?.error || pollError.message
      );
      pollingSinceTimestamp.current = Date.now();
      lastOwnActionTimestamp.current = null;
      if (pollError.response?.status === 404) {
        console.error(
          "[Polling Check - ActionTS] Risorsa non trovata (404), fermo il polling e mostro errore."
        );
        if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
        setError(
          "La lavagna o il gruppo potrebbero essere stati eliminati o l'accesso negato."
        );
        setCurrentBoardData(null);
        setSiblingBoards([]);
      }
    }
  }, [groupId, boardId, hasUpdates]);

  // --- Ciclo di Vita e Caricamento Dati ---

  // Carica suggerimenti (invariato)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (productSuggestions.length > 0) return;
      setLoadingSuggestions(true);
      try {
        const response = await fetch("/images/prodotti.json");
        if (!response.ok) throw new Error(`Errore HTTP ${response.status}`);
        const data = await response.json();
        if (
          Array.isArray(data) &&
          data.every((item) => typeof item === "string")
        ) {
          setProductSuggestions(data);
        } else {
          console.error(
            "[GroupBoardView] Formato JSON suggerimenti non valido:",
            data
          );
          setProductSuggestions([]);
        }
      } catch (fetchError) {
        console.error(
          "[GroupBoardView] Errore fetch suggerimenti:",
          fetchError
        );
        setProductSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Funzione caricamento/refresh dati (invariata)
  const loadBoardAndGroupData = useCallback(
    async (gId, bId, showLoadingToast = false) => {
      setError(null);
      const numericGroupId = parseInt(gId);
      const numericBoardId = parseInt(bId);
      if (
        isNaN(numericGroupId) ||
        isNaN(numericBoardId) ||
        numericGroupId <= 0 ||
        numericBoardId <= 0
      ) {
        toast.error("ID Gruppo o Lavagna non validi.");
        navigate("/groups-dashboard", { replace: true });
        return;
      }
      if (showLoadingToast)
        toast.info("Aggiornamento dati...", { autoClose: 1000 });
      try {
        await fetchGroupDetails(numericGroupId);
        const now = Date.now();
        pollingSinceTimestamp.current = now;
        // console.log(`[loadBoardAndGroupData] Dati caricati/refresh. Timestamp iniziale 'since': ${pollingSinceTimestamp.current}`);
        setHasUpdates(false);
      } catch (err) {
        console.error(`[loadBoardAndGroupData] Errore:`, err);
        setError(err.message || "Errore caricamento dati gruppo/lavagne.");
        setCurrentBoardData(null);
        setSiblingBoards([]);
        pollingSinceTimestamp.current = null;
        if (pollingIntervalId.current) {
          clearInterval(pollingIntervalId.current);
          pollingIntervalId.current = null;
        }
      }
    },
    [fetchGroupDetails, navigate]
  );

  // Carica dati al cambio ID URL (invariato)
  useEffect(() => {
    const currentGroupId = parseInt(groupId);
    const currentBoardId = parseInt(boardId);
    lastOwnActionTimestamp.current = null;
    if (currentGroupId > 0 && currentBoardId > 0) {
      // Semplificato controllo NaN
      pollingSinceTimestamp.current = null;
      loadBoardAndGroupData(groupId, boardId, false);
      if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
      pollingIntervalId.current = null;
    } else {
      console.error("[GroupBoardView] ID URL non validi al mount/cambio.");
      setError("ID Gruppo o Lavagna non validi nell'URL.");
      setCurrentBoardData(null);
      setSiblingBoards([]);
      pollingSinceTimestamp.current = null;
      if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
      pollingIntervalId.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, boardId]); // loadBoardAndGroupData è stabile

  // Sincronizza stato locale con context (invariato)
  useEffect(() => {
    // console.log("[GroupBoardView DEBUG] useEffect Sync - START. groupLoading:", groupLoading);
    // try { console.log("[GroupBoardView DEBUG] currentGroup dal context:", JSON.stringify(currentGroup)); } catch (e) { console.log("[GroupBoardView DEBUG] currentGroup dal context (stringify fallito):", currentGroup); }
    // console.log("[GroupBoardView DEBUG] Ruolo letto dal context (currentGroup?.currentUserRole):", currentGroup?.currentUserRole);
    // console.log("[GroupBoardView DEBUG] contextBoards:", contextBoards?.length);

    if (!groupLoading) {
      if (currentGroup && String(currentGroup.id) === String(groupId)) {
        const foundBoard = contextBoards?.find(
          (b) => String(b.id) === String(boardId)
        );
        // console.log("[GroupBoardView DEBUG] Board trovata nel context (foundBoard):", !!foundBoard);
        if (foundBoard) {
          const processedBoard = {
            ...foundBoard,
            products: (foundBoard.products || []).map((p) => ({
              ...p,
              is_purchased: !!p.is_purchased,
            })),
            userRole: currentGroup.currentUserRole,
            // ---- AGGIUNTA MAPPING CORRETTO PER NUOVA LOGICA CHATBOT ----
            // Assicuriamo che i nomi usati nella nuova logica siano presenti
            // anche se boardPropsForUI li mappa già, è più sicuro averli qui
            groupId: parseInt(groupId), // Già presente implicitamente, ma meglio esplicito
            userRoleInGroup: currentGroup.currentUserRole,
            isDefaultGroupBoard: !!foundBoard.is_group_default,
            // -----------------------------------------------------------
          };
          // try { console.log("[GroupBoardView DEBUG] processedBoard DA IMPOSTARE:", JSON.stringify(processedBoard, null, 2)); } catch (e) { console.log("[GroupBoardView DEBUG] processedBoard DA IMPOSTARE (stringify fallito):", processedBoard); }
          if (
            JSON.stringify(processedBoard) !== JSON.stringify(currentBoardData)
          ) {
            // console.log("[GroupBoardView DEBUG] Differenza rilevata, chiamo setCurrentBoardData!");
            setCurrentBoardData(processedBoard);
          } else {
            // console.log("[GroupBoardView DEBUG] Nessuna differenza, non chiamo setCurrentBoardData.");
          }
          setSiblingBoards(contextBoards || []);
          if (error?.includes("non trovata")) setError(null);
        } else {
          if (currentBoardData !== null) {
            console.warn(
              `[GroupBoardView Sync] Board ${boardId} NON trovata nel context aggiornato per Group ${groupId}. Resetto currentBoardData.`
            );
            setError(`Lavagna ${boardId} non trovata o accesso negato.`);
            setCurrentBoardData(null);
          }
          setSiblingBoards(contextBoards || []);
        }
      } else if (!currentGroup || String(currentGroup.id) !== String(groupId)) {
        // console.log(`[GroupBoardView Sync] Gruppo nel context (${currentGroup?.id}) non corrisponde a quello richiesto (${groupId}). Resetto currentBoardData.`);
        setCurrentBoardData(null);
        setSiblingBoards([]);
        if (!error && !groupLoading) setError(null);
      }
    } else {
      // console.log("[GroupBoardView DEBUG] useEffect Sync - Skip (groupLoading è true).");
    }
    // console.log("[GroupBoardView DEBUG] useEffect Sync - END.");
  }, [
    currentGroup,
    contextBoards,
    groupId,
    boardId,
    groupLoading,
    currentBoardData,
    error,
  ]);

  // Polling useEffect (invariato)
  useEffect(() => {
    const numericGroupId = parseInt(groupId);
    const numericBoardId = parseInt(boardId);
    const handleVisibilityChange = () => {
      const nowVisible = !document.hidden;
      isDocumentVisible.current = nowVisible;
      if (nowVisible) {
        if (
          !groupLoading &&
          !error &&
          !hasUpdates &&
          !pollingIntervalId.current &&
          pollingSinceTimestamp.current
        ) {
          const checkTimeout = setTimeout(() => {
            if (
              isDocumentVisible.current &&
              !hasUpdates &&
              !error &&
              !groupLoading &&
              pollingSinceTimestamp.current
            ) {
              checkUpdates();
            }
          }, 500);
          // Cleanup per evitare esecuzioni multiple
          return () => clearTimeout(checkTimeout);
        }
      } else {
        if (pollingIntervalId.current) {
          clearInterval(pollingIntervalId.current);
          pollingIntervalId.current = null;
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    isDocumentVisible.current = !document.hidden;
    if (
      groupLoading ||
      error ||
      !numericGroupId ||
      !numericBoardId ||
      hasUpdates ||
      !isDocumentVisible.current ||
      !pollingSinceTimestamp.current
    ) {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
      }
    } else {
      if (!pollingIntervalId.current) {
        pollingIntervalId.current = setInterval(checkUpdates, POLLING_INTERVAL);
      }
    }
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
      }
    };
  }, [groupId, boardId, groupLoading, error, hasUpdates, checkUpdates]);

  // Handler click refresh (invariato)
  const handleRefreshClick = useCallback(
    async (showLoadingToast = true) => {
      lastOwnActionTimestamp.current = null;
      if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
      pollingIntervalId.current = null;
      setHasUpdates(false);
      await loadBoardAndGroupData(groupId, boardId, showLoadingToast);
    },
    [groupId, boardId, loadBoardAndGroupData]
  );

  // Wrapper per azioni interne (invariato)
  const triggerRefreshAfterOwnAction = useCallback(
    (actionCompletionTimestamp) => {
      if (
        actionCompletionTimestamp &&
        typeof actionCompletionTimestamp === "number"
      ) {
        lastOwnActionTimestamp.current = actionCompletionTimestamp;
      } else {
        lastOwnActionTimestamp.current = null; // Reset se timestamp non valido
      }
      // Assicurati che handleRefreshClick sia chiamato solo se necessario
      // e non sovrascriva immediatamente il timestamp appena impostato
      // (se handleRefreshClick lo resettasse a null troppo presto)
      // Potrebbe essere meglio chiamare loadBoardAndGroupData direttamente
      // se handleRefreshClick fa più di questo.
      // Per ora, manteniamo la chiamata a handleRefreshClick.
      handleRefreshClick(false); // Passa false per evitare toast di loading
    },
    [handleRefreshClick] // Dipende da handleRefreshClick
  );

  // Props Memoizzate per Board (verifica aggiunta campi per sicurezza)
  const boardPropsForUI = useMemo(() => {
    if (!currentBoardData) return null;
    return {
      id: currentBoardData.id,
      name: currentBoardData.name,
      background: currentBoardData.background,
      userBackground: currentBoardData.userBackground,
      products: currentBoardData.products || [],
      isGroupContext: true,
      groupId: parseInt(groupId), // Assicura sia numero
      // Nomi usati nella nuova logica chatbot (vengono da currentBoardData sync)
      userRoleInGroup:
        currentBoardData.userRoleInGroup || currentBoardData.userRole,
      isDefaultGroupBoard:
        !!currentBoardData.isDefaultGroupBoard ||
        !!currentBoardData.is_group_default,
      // Alias per compatibilità (se Board li usa ancora)
      userRole: currentBoardData.userRoleInGroup || currentBoardData.userRole,
      is_group_default:
        !!currentBoardData.isDefaultGroupBoard ||
        !!currentBoardData.is_group_default,
    };
  }, [currentBoardData, groupId]);

  // Permessi Memoizzati per FAB (invariato)
  const permissions = useMemo(() => {
    if (!boardPropsForUI || !boardPropsForUI.userRoleInGroup)
      return { canAdd: false };
    const role = boardPropsForUI.userRoleInGroup;
    const isDefault = !!boardPropsForUI.isDefaultGroupBoard;
    const canAdd = !(role === "level2" && isDefault);
    return { canAdd };
  }, [boardPropsForUI]); // Dipende da boardPropsForUI che ora include i campi corretti

  // Handlers Modale Aggiungi Prodotto (invariati)
  const handleShowAddModal = useCallback(() => setShowAddModal(true), []);
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setNewItemNameModal("");
    setIsAddingItem(false);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  }, []);
  const handleModalInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setNewItemNameModal(value);
      if (value.trim().length > 0 && productSuggestions.length > 0) {
        const lowerCaseValue = value.toLowerCase();
        const filtered = productSuggestions.filter((s) =>
          s.toLowerCase().startsWith(lowerCaseValue)
        );
        setFilteredSuggestions(filtered.slice(0, 10));
        setShowSuggestions(filtered.length > 0);
      } else {
        setFilteredSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [productSuggestions]
  );
  const handleSuggestionClick = useCallback((suggestion) => {
    setNewItemNameModal(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    modalInputRef.current?.focus();
  }, []);
  const handleModalAddItem = useCallback(
    async (event) => {
      event.preventDefault();
      setShowSuggestions(false);
      setFilteredSuggestions([]);
      const trimmedName = newItemNameModal.trim();
      // Usa boardPropsForUI che ora contiene i campi corretti per la logica permessi
      if (!boardPropsForUI || !trimmedName || !permissions.canAdd) {
        console.warn(
          "[handleModalAddItem] Skip. Dati mancanti o permessi insufficienti.",
          {
            hasBoard: !!boardPropsForUI,
            trimmedName,
            canAdd: permissions.canAdd,
          }
        );
        return;
      }
      setIsAddingItem(true);
      try {
        // Passa boardPropsForUI direttamente a addItemAction se necessario
        const result = await addItemAction(
          trimmedName,
          [], // category (opzionale)
          () => {}, // onSuccess callback (gestito da triggerRefresh)
          setNewItemNameModal, // per reset input
          boardPropsForUI, // contesto board/gruppo
          null, // listId (non applicabile)
          null // listType (non applicabile)
        );
        // Estrai timestamp dalla risposta dell'azione (se fornito)
        const completionTs =
          result?.actionCompletionTimestamp || // Nome campo preferito dal backend batch
          result?.lastUpdateTimestamp || // Nome campo fallback
          null; // Nessun timestamp disponibile
        triggerRefreshAfterOwnAction(completionTs); // Trigger refresh con timestamp (o null)
        handleCloseAddModal(); // Chiudi modale dopo successo
      } catch (error) {
        console.error("Errore addItemAction (Modal Group):", error);
        toast.error(`Errore aggiunta prodotto: ${error.message || "Riprova."}`);
      } finally {
        setIsAddingItem(false); // Resetta stato caricamento
      }
    },
    [
      newItemNameModal,
      boardPropsForUI,
      permissions.canAdd,
      triggerRefreshAfterOwnAction,
      handleCloseAddModal,
      setNewItemNameModal, // Aggiunta dipendenza mancante
      addItemAction, // Aggiunta dipendenza mancante
    ]
  );
  useEffect(() => {
    if (showAddModal && modalInputRef.current) {
      const timer = setTimeout(() => modalInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [showAddModal]);

  // Logica Swipe (invariata)
  const orderedGroupBoards = useMemo(() => {
    if (!Array.isArray(siblingBoards)) return [];
    return [...siblingBoards].sort((a, b) => {
      // Usa i nomi dei campi coerenti con la nuova logica
      const aIsDefault = !!a?.isDefaultGroupBoard || !!a?.is_group_default;
      const bIsDefault = !!b?.isDefaultGroupBoard || !!b?.is_group_default;
      if (aIsDefault !== bIsDefault) {
        return aIsDefault ? -1 : 1;
      }
      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [siblingBoards]); // Dipende solo da siblingBoards
  const currentBoardIndex = useMemo(() => {
    if (!boardId || orderedGroupBoards.length === 0) return -1;
    const numericBoardId = parseInt(boardId);
    if (isNaN(numericBoardId)) return -1;
    return orderedGroupBoards.findIndex((b) => b?.id === numericBoardId);
  }, [boardId, orderedGroupBoards]);
  const navigateToBoardByIndex = useCallback(
    (index) => {
      if (index >= 0 && index < orderedGroupBoards.length) {
        const nextBoard = orderedGroupBoards[index];
        if (nextBoard?.id && String(nextBoard.id) !== String(boardId)) {
          navigate(`/groups/${groupId}/boards/${nextBoard.id}`);
        }
      }
    },
    [orderedGroupBoards, boardId, groupId, navigate]
  );
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (
        !groupLoading &&
        currentBoardIndex !== -1 &&
        currentBoardIndex < orderedGroupBoards.length - 1
      ) {
        navigateToBoardByIndex(currentBoardIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (!groupLoading && currentBoardIndex > 0) {
        navigateToBoardByIndex(currentBoardIndex - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 70,
  });
  const handleBoardSelectionChange = useCallback(
    (newBoardId) => {
      if (String(newBoardId) !== String(boardId)) {
        navigate(`/groups/${groupId}/boards/${newBoardId}`);
      }
    },
    [boardId, groupId, navigate]
  );

  // ---- NUOVE FUNZIONI E CALLBACK PER CHATBOT ----

  // Funzione per aprire/chiudere il chatbot (invariata)
  const handleToggleChatbot = useCallback(() => {
    console.log("[GroupBoardView] Toggle Chatbot Richiesto!");
    setIsChatbotOpen((prev) => !prev);
  }, []);

  // ---- MODIFICATO: Funzione per aggiungere items dal chatbot ----
  const handleAddItemsFromChatbot = useCallback(
    async (itemNames, boardData) => {
      // Nome parametro cambiato per coerenza
      // ---- INIZIO CODICE DA SOSTITUIRE NEL CORPO DI handleAddItemsFromChatbot ----
      {
        // Parentesi graffa di apertura della funzione originale (mantenuta per chiarezza, non strettamente necessaria)
        console.log(
          "[GroupBoardView] ESEGUO handleAddItemsFromChatbot per:",
          itemNames
        ); // Log aggiornato
        console.log("[GroupBoardView] Contesto Board ricevuto:", {
          id: boardData?.id,
          name: boardData?.name,
          groupId: boardData?.groupId,
          userRole: boardData?.userRoleInGroup, // Verifica che questo sia nel tuo boardContext
          isDefault: boardData?.isDefaultGroupBoard, // Verifica che questo sia nel tuo boardContext
        });

        // Controlli preliminari su input e contesto
        if (!Array.isArray(itemNames) || itemNames.length === 0) {
          toast.warn("Nessun ingrediente valido da aggiungere ricevuto.");
          return;
        }
        // Verifica i campi essenziali ricevuti in boardData
        if (
          !boardData?.id ||
          !boardData?.groupId ||
          typeof boardData?.userRoleInGroup === "undefined" ||
          typeof boardData?.isDefaultGroupBoard === "undefined"
        ) {
          toast.error(
            "Errore interno: Contesto della lavagna incompleto per aggiungere ingredienti."
          );
          console.error(
            "BoardContext (boardData) ricevuto da Chatbot è incompleto:",
            boardData
          );
          return;
        }

        // Verifica Permessi Frontend basati sul ruolo e se la board è default
        const role = boardData.userRoleInGroup;
        const isDefault = !!boardData.isDefaultGroupBoard;
        const canAdd = !(role === "level2" && isDefault); // Level2 non può aggiungere a default

        if (!canAdd) {
          toast.error(
            "Non hai i permessi per aggiungere prodotti a questa lavagna specifica."
          );
          return;
        }

        // Prepara chiamata API per l'endpoint BATCH
        const numericGroupId = parseInt(boardData.groupId);
        const numericBoardId = parseInt(boardData.id);
        // Doppio controllo sugli ID numerici
        if (isNaN(numericGroupId) || isNaN(numericBoardId)) {
          toast.error(
            "ID Gruppo o Lavagna non validi identificati per l'aggiunta batch."
          );
          return;
        }
        const endpoint = `/auth/groups/${numericGroupId}/boards/${numericBoardId}/products/batch`;

        // Feedback visivo (Toast Loading) e Chiamata API
        const toastId = toast.loading(
          `Aggiungo ${itemNames.length} ingredienti...`
        );

        try {
          console.log(
            `[GroupBoardView] Chiamando API Batch: POST ${endpoint} con ${itemNames.length} nomi.`
          );
          // Corpo della richiesta: oggetto con chiave "names" e valore l'array di stringhe
          const response = await api.post(endpoint, { names: itemNames });

          // Estrai dati dalla risposta del backend
          const addedCount = response.data?.addedCount ?? 0; // Numero prodotti aggiunti
          const timestamp = response.data?.actionCompletionTimestamp || null; // Timestamp per refresh

          // Aggiorna il Toast con l'esito
          toast.update(toastId, {
            render: `${addedCount} su ${itemNames.length} ingredienti aggiunti alla lavagna!`,
            type: addedCount > 0 ? "success" : "info", // Successo se almeno 1 aggiunto, altrimenti info
            isLoading: false,
            autoClose: 3500, // Tempo visualizzazione toast
            closeOnClick: true,
            draggable: true,
          });

          console.log(
            `[GroupBoardView] Risposta API Batch Add ricevuta:`,
            response.data
          );

          // Triggera l'aggiornamento della vista SOLO se sono stati aggiunti prodotti
          // Usa la callback triggerRefreshAfterOwnAction passata dalle props (o definita nel componente)
          if (
            addedCount > 0 &&
            typeof triggerRefreshAfterOwnAction === "function"
          ) {
            triggerRefreshAfterOwnAction(timestamp);
          } else if (addedCount > 0) {
            // Fallback se la callback non fosse disponibile (improbabile ma sicuro)
            console.warn(
              "[GroupBoardView] triggerRefreshAfterOwnAction non disponibile, refresh manuale necessario."
            );
            handleRefreshClick(false); // Usa l'altro handler di refresh se disponibile
          }
        } catch (error) {
          // Gestione Errori API
          console.error(
            "[GroupBoardView] Errore durante chiamata API aggiunta batch:",
            error.response?.data || error.message || error
          );
          // Aggiorna il Toast con messaggio di errore
          toast.update(toastId, {
            render: `Errore aggiunta ingredienti: ${error.response?.data?.error || "Riprova più tardi."}`,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
        }
      } // Parentesi graffa di chiusura della funzione originale
      // ---- FINE CODICE DA SOSTITUIRE ----
    },
    [triggerRefreshAfterOwnAction, handleRefreshClick] // <-- AGGIORNATE DIPENDENZE
  );

  // --- Rendering ---

  // Stati caricamento/errore (invariati)
  if (groupLoading && !currentBoardData) {
    return (
      <div className="group-board-view-status d-flex flex-column justify-content-center align-items-center vh-80">
        <LoadingSpinner />
        <p className="mt-3 font-secondary">Caricamento dati gruppo...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="group-board-view-status alert alert-danger m-3">
        <h4>Errore Caricamento</h4> <p>{error}</p>
        <Link to="/groups-dashboard" className="btn btn-secondary me-2">
          Torna ai Gruppi
        </Link>
        <Link to="/dashboard" className="btn btn-outline-secondary">
          Dashboard
        </Link>
      </div>
    );
  }
  if (!groupLoading && !currentBoardData) {
    return (
      <div className="group-board-view-status alert alert-warning m-3">
        Lavagna non trovata o dati non disponibili.
        <Link to="/groups-dashboard" className="btn btn-secondary ms-2">
          Torna ai Gruppi
        </Link>
      </div>
    );
  }

  // Rendering Principale
  return (
    <div {...handlers} className="group-board-view-container">
      {/* Header Gruppo - PASSA LA NUOVA PROP onToggleChatbot (invariato) */}
      <div
        className={`sub-header-wrapper ${isSubHeaderHidden ? "sub-header--hidden" : ""}`}
      >
        {currentBoardData && currentGroup && (
          <GroupHeader
            currentBoardData={currentBoardData} // Passa il boardData aggiornato
            allGroupBoards={orderedGroupBoards}
            onBoardSelect={handleBoardSelectionChange}
            onDataNeedsRefresh={triggerRefreshAfterOwnAction} // Usa sempre triggerRefresh
            isLoadingBoards={groupLoading}
            hasUpdates={hasUpdates}
            onRefreshClick={handleRefreshClick}
            onToggleChatbot={handleToggleChatbot} // <-- PROP PASSATA QUI
          />
        )}
      </div>

      {/* Area Contenuto Board (invariata) */}
      <div className="board-content-area">
        {boardPropsForUI ? (
          <Board
            key={boardPropsForUI.id}
            selectedBoard={boardPropsForUI} // Usa le props memoizzate aggiornate
            hideSubHeader={hideSubHeader}
            showSubHeader={showSubHeader}
            onDataRefreshNeeded={triggerRefreshAfterOwnAction} // Passa sempre triggerRefresh
          />
        ) : (
          groupLoading && (
            <div className="board-placeholder-loading text-center p-5">
              <LoadingSpinner />
              <p className="mt-2 font-secondary">Caricamento lavagna...</p>
            </div>
          )
        )}
      </div>

      {/* FAB e Modale Add (invariati, usa permissions aggiornato) */}
      {permissions.canAdd && boardPropsForUI && (
        <button
          className="fab-add-button"
          onClick={handleShowAddModal}
          title="Aggiungi Prodotto"
          aria-label="Aggiungi Prodotto"
        >
          <FaPlus />
        </button>
      )}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-primary text-accent">
            Aggiungi Prodotto
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalAddItem}>
          <Modal.Body>
            <Form.Group
              controlId="newItemNameModalGroup"
              className="mb-0 position-relative"
            >
              <Form.Label visuallyHidden>Nome Prodotto</Form.Label>
              <Form.Control
                ref={modalInputRef}
                type="text"
                className="font-secondary"
                placeholder={
                  loadingSuggestions ? "Carico..." : "Nome prodotto..."
                }
                value={newItemNameModal}
                onChange={handleModalInputChange}
                onFocus={handleModalInputChange} // Mostra suggerimenti anche al focus
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Ritarda chiusura per click
                required
                autoComplete="off"
                disabled={loadingSuggestions || isAddingItem}
              />
              <Form.Control.Feedback type="invalid">
                Inserisci un nome per il prodotto.
              </Form.Control.Feedback>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="suggestion-list">
                  {filteredSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onMouseDown={(e) => {
                        // Usa onMouseDown per evitare blur prima del click
                        e.preventDefault();
                        handleSuggestionClick(suggestion);
                      }}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseAddModal}
              disabled={isAddingItem}
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                isAddingItem || !newItemNameModal.trim() || loadingSuggestions
              }
            >
              {isAddingItem ? (
                <BootstrapSpinner size="sm" className="me-1" />
              ) : null}
              Aggiungi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* NUOVO: Rendering Condizionale del Chatbot (invariato) */}
      {isChatbotOpen && (
        <Chatbot
          // Passa le props necessarie al Chatbot
          isOpen={isChatbotOpen} // Indica se deve essere visibile
          onClose={handleToggleChatbot} // Funzione per chiudere (riutilizziamo il toggle)
          boardContext={boardPropsForUI} // Passa il contesto della lavagna (aggiornato)
          onAddItems={handleAddItemsFromChatbot} // Passa la callback per aggiungere items (aggiornata)
        />
      )}
      {/* FINE NUOVO */}
    </div>
  );
};

export default GroupBoardView;
