/* ==== src/contexts/GroupContext.jsx (v9 - Aggiunta leaveCurrentGroup) ==== */
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import api from "../services/api";
import notificationService from "../services/notificationService";
import { toast } from "react-toastify";
import jwt_decode from "jwt-decode"; // <-- IMPORT AGGIUNTO

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [boards, setBoards] = useState([]);

  // --- fetchGroups ---
  const fetchGroups = useCallback(async () => {
    // console.log("[GroupContext] fetchGroups: Ricarico lista gruppi...");
    try {
      const response = await api.get("/auth/groups");
      setGroups(response.data || []);
    } catch (error) {
      console.error("[GroupContext] Errore fetchGroups:", error);
      if (error.response?.status !== 401) {
        toast.error(
          error.response?.data?.message || "Errore caricamento gruppi."
        );
      }
      setGroups([]);
    }
  }, []);

  // --- useEffect fetch iniziale ---
  useEffect(() => {
    if (localStorage.getItem("token")) {
      setLoading(true);
      fetchGroups().finally(() => setLoading(false));
    } else {
      setGroups([]);
    }
  }, [fetchGroups]);

  // --- createGroup ---
  const createGroup = async (groupData) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/groups", groupData);
      const newGroup = response.data;
      if (newGroup && newGroup.id) {
        await fetchGroups();
        toast.success(`Gruppo "${newGroup.name}" creato!`);
        return newGroup;
      } else {
        toast.error("Errore nella risposta creazione gruppo.");
        return null;
      }
    } catch (error) {
      console.error("[GroupContext] Errore createGroup:", error);
      toast.error(error.response?.data?.message || "Errore creazione gruppo");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --- fetchGroupDetails ---
  const fetchGroupDetails = useCallback(async (groupId) => {
    // console.log(`[GroupContext] fetchGroupDetails START - groupId: ${groupId}`); // Rimosso log
    setLoading(true);
    setCurrentGroup(null);
    setMembers([]);
    setBoards([]);

    try {
      const numericGroupId = parseInt(groupId);
      if (isNaN(numericGroupId) || numericGroupId <= 0) {
        throw new Error("ID Gruppo non valido");
      }

      // console.log(`[GroupContext] Chiamate API per ${numericGroupId}...`); // Rimosso log
      const results = await Promise.allSettled([
        api.get(`/auth/groups/${numericGroupId}`),
        api.get(`/auth/groups/${numericGroupId}/members`),
        api.get(`/auth/groups/${numericGroupId}/boards`),
      ]);
      const [groupResult, membersResult, boardsResult] = results;

      // console.log("[GroupContext] Risultati Fetch:", { ... }); // Rimosso log

      if (
        groupResult.status === "fulfilled" &&
        groupResult.value.data?.id &&
        groupResult.value.data?.currentUserRole
      ) {
        setCurrentGroup({ ...groupResult.value.data });
      } else {
        const errorReason = groupResult.reason;
        const errorMessage =
          errorReason?.response?.data?.message ||
          errorReason?.message ||
          "Errore caricamento dati gruppo.";
        console.error(
          "[GroupContext] ERRORE CRITICO recupero gruppo:",
          errorReason
        );
        setMembers([]);
        setBoards([]);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (membersResult.status === "fulfilled") {
        if (Array.isArray(membersResult.value.data)) {
          setMembers(membersResult.value.data);
          // console.log(`[GroupContext] Membri OK (${membersResult.value.data.length})`); // Rimosso log
        } else {
          console.warn(
            "[GroupContext] API Membri non ha restituito array:",
            membersResult.value.data
          );
          setMembers([]);
          toast.warn("Formato dati membri non valido.");
        }
      } else {
        const errorReason = membersResult.reason;
        const errorMessage =
          errorReason?.response?.data?.message ||
          errorReason?.message ||
          "Errore caricamento membri.";
        console.error("[GroupContext] ERRORE recupero membri:", errorReason);
        toast.error(errorMessage);
        setMembers([]);
      }

      if (boardsResult.status === "fulfilled") {
        if (Array.isArray(boardsResult.value.data)) {
          setBoards(boardsResult.value.data);
          // console.log(`[GroupContext] Lavagne OK (${boardsResult.value.data.length})`); // Rimosso log
        } else {
          console.warn(
            "[GroupContext] API Lavagne non ha restituito array:",
            boardsResult.value.data
          );
          setBoards([]);
          toast.warn("Formato dati lavagne non valido.");
        }
      } else {
        const errorReason = boardsResult.reason;
        const errorMessage =
          errorReason?.response?.data?.message ||
          errorReason?.message ||
          "Errore caricamento lavagne.";
        console.error("[GroupContext] ERRORE recupero lavagne.", errorReason);
        toast.error(errorMessage);
        setBoards([]);
      }
    } catch (error) {
      console.error("[GroupContext] fetchGroupDetails CATCH:", error);
      setCurrentGroup(null);
      setMembers([]);
      setBoards([]);
      throw error;
    } finally {
      // console.log("[GroupContext] fetchGroupDetails FINALLY"); // Rimosso log
      setLoading(false);
    }
  }, []);

  // --- createBoard ---
  const createBoard = async (name, background) => {
    if (!currentGroup) throw new Error("Nessun gruppo corrente selezionato.");
    setLoading(true);
    try {
      const response = await api.post(
        `/auth/groups/${currentGroup.id}/boards`,
        { name, background }
      );
      setBoards((prev) => [...prev, response.data]);
      toast.success("Lavagnetta creata!");
      return response.data;
    } catch (error) {
      console.error("[GroupContext] Errore createBoard:", error);
      toast.error(error.response?.data?.message || "Errore creazione lavagna.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --- deleteBoard ---
  const deleteBoard = async (boardId) => {
    if (!currentGroup) throw new Error("Nessun gruppo corrente selezionato.");
    const numericBoardId = parseInt(boardId);
    if (isNaN(numericBoardId) || numericBoardId <= 0) {
      toast.error("ID lavagna non valido.");
      return;
    }
    setLoading(true);
    try {
      await api.delete(
        `/auth/groups/${currentGroup.id}/boards/${numericBoardId}`
      );
      setBoards((prev) => prev.filter((b) => b.id !== numericBoardId));
      toast.success("Lavagnetta eliminata");
    } catch (error) {
      console.error("[GroupContext] Errore deleteBoard:", error);
      toast.error(
        error.response?.data?.message || "Errore eliminazione lavagna."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --- Funzioni Notifiche ---
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response || []);
    } catch (error) {
      console.error("[GroupContext] Errore recupero notifiche:", error);
    }
  }, [setNotifications]);

  useEffect(() => {
    let intervalId = null;
    if (localStorage.getItem("token")) {
      fetchNotifications();
      intervalId = setInterval(fetchNotifications, 60000);
    } else {
      setNotifications([]);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  const acceptInvite = async (notificationId) => {
    setLoading(true);
    try {
      await notificationService.acceptInvite(notificationId);
      await Promise.all([fetchGroups(), fetchNotifications()]);
      toast.success("Azione completata!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Errore durante l'azione.");
    } finally {
      setLoading(false);
    }
  };
  const rejectInvite = async (notificationId) => {
    setLoading(true);
    try {
      await notificationService.rejectInvite(notificationId);
      await fetchNotifications();
      toast.info("Azione completata.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Errore durante l'azione.");
    } finally {
      setLoading(false);
    }
  };

  // --- Funzioni gestione membri ---
  const inviteUser = async (groupId, userEmail, role = "level2") => {
    try {
      const numericGroupId = parseInt(groupId);
      if (isNaN(numericGroupId) || numericGroupId <= 0)
        throw new Error("ID gruppo non valido.");
      await api.post(`/auth/groups/${numericGroupId}/invite`, {
        members: [{ email: userEmail, role }],
      });
      toast.success(`Invito inviato a ${userEmail}`);
    } catch (error) {
      console.error("[GroupContext] Errore inviteUser:", error);
      toast.error(error.response?.data?.message || "Errore invio invito.");
      throw error;
    }
  };
  const updateMemberRole = async (groupId, userId, newRole) => {
    const numericGroupId = parseInt(groupId);
    const numericUserId = parseInt(userId);
    if (
      isNaN(numericGroupId) ||
      numericGroupId <= 0 ||
      isNaN(numericUserId) ||
      numericUserId <= 0
    ) {
      toast.error("ID gruppo/utente non validi.");
      throw new Error("ID non validi.");
    }
    try {
      await api.put(`/auth/groups/${numericGroupId}/members/${numericUserId}`, {
        role: newRole,
      });
      // Se il gruppo corrente è quello modificato, aggiorna lo stato dei membri
      if (currentGroup?.id === numericGroupId) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === numericUserId ? { ...m, role: newRole } : m
          )
        );
        // Se l'utente sta modificando se stesso (improbabile con la UI attuale ma per sicurezza)
        // Aggiorna anche currentGroup.currentUserRole
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwt_decode(token);
          if (decoded?.id === numericUserId) {
            setCurrentGroup((prev) =>
              prev ? { ...prev, currentUserRole: newRole } : null
            );
          }
        }
      }
    } catch (error) {
      console.error("[GroupContext] Errore updateMemberRole:", error);
      throw new Error(
        error.response?.data?.message || "Errore aggiornamento ruolo."
      );
    }
  };
  const requestRoleChange = async (groupId, targetUserId, newRole) => {
    const numericGroupId = parseInt(groupId);
    const numericTargetUserId = parseInt(targetUserId);
    if (
      isNaN(numericGroupId) ||
      numericGroupId <= 0 ||
      isNaN(numericTargetUserId) ||
      numericTargetUserId <= 0
    ) {
      toast.error("ID non validi.");
      throw new Error("ID non validi.");
    }
    if (!["level1", "level2"].includes(newRole)) {
      toast.error("Ruolo proposto non valido.");
      throw new Error("Ruolo non valido.");
    }
    try {
      await api.post(
        `/auth/groups/${numericGroupId}/members/${numericTargetUserId}/request-role-change`,
        { role: newRole }
      );
      toast.info("Richiesta inviata.");
    } catch (error) {
      console.error("[GroupContext] Errore requestRoleChange:", error);
      throw new Error(
        error.response?.data?.message || "Errore invio richiesta."
      );
    }
  };

  // --- Funzione Elimina Gruppo (invariata) ---
  const deleteCurrentUserGroup = useCallback(
    async (groupId) => {
      setLoading(true);
      let numericGroupId;
      try {
        numericGroupId = parseInt(groupId);
        if (isNaN(numericGroupId) || numericGroupId <= 0) {
          throw new Error("ID gruppo non valido.");
        }
        await api.delete(`/auth/groups/${numericGroupId}`);
        setGroups((prevGroups) =>
          prevGroups.filter((g) => g.id !== numericGroupId)
        );
        if (currentGroup && currentGroup.id === numericGroupId) {
          setCurrentGroup(null);
          setMembers([]);
          setBoards([]);
        }
        // Non mostriamo toast qui, lo fa executeDeleteGroup in GroupDetail
      } catch (error) {
        console.error("[GroupContext] Errore deleteCurrentUserGroup:", error);
        toast.error(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Errore eliminazione gruppo."
        );
        throw error; // Rilancia per gestione in GroupDetail
      } finally {
        setLoading(false);
      }
    },
    [currentGroup] // Mantenuta dipendenza corretta
  );

  // --- NUOVA Funzione Abbandona Gruppo ---
  const leaveCurrentGroup = useCallback(
    async (groupId) => {
      setLoading(true);
      let numericGroupId;
      try {
        numericGroupId = parseInt(groupId);
        if (isNaN(numericGroupId) || numericGroupId <= 0) {
          throw new Error("ID gruppo non valido.");
        }
        // Chiama l'endpoint per rimuovere l'utente corrente dal gruppo
        await api.delete(`/auth/groups/${numericGroupId}/members/me`);

        // Aggiorna la lista dei gruppi globali
        await fetchGroups();

        // Se il gruppo abbandonato era quello corrente, resetta currentGroup etc.
        if (currentGroup && currentGroup.id === numericGroupId) {
          setCurrentGroup(null);
          setMembers([]);
          setBoards([]);
        }
        toast.success("Hai abbandonato il gruppo.");
        return true; // Indica successo
      } catch (error) {
        console.error("[GroupContext] Errore leaveCurrentGroup:", error);
        toast.error(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Errore durante l'abbandono del gruppo."
        );
        return false; // Indica fallimento
      } finally {
        setLoading(false);
      }
    },
    [currentGroup, fetchGroups] // Aggiunte dipendenze
  );

  // --- Valore fornito ---
  const value = {
    groups,
    loading,
    notifications,
    unreadNotificationCount: notifications.length,
    fetchGroups,
    fetchNotifications,
    currentGroup,
    members,
    boards,
    fetchGroupDetails,
    createGroup,
    inviteUser,
    updateMemberRole,
    requestRoleChange,
    acceptInvite,
    rejectInvite,
    createBoard,
    deleteBoard,
    deleteCurrentUserGroup,
    leaveCurrentGroup, // Aggiunta nuova funzione
  };

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
};

// Hook custom
export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
};
//funzioante DA COMMIT ORIGINALE
