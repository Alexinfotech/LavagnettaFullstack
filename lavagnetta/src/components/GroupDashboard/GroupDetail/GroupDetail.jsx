/* ==== src/components/GroupDashboard/GroupDetail/GroupDetail.jsx (v21 - Import Modale Leave Locale) ==== */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGroup } from "../../../contexts/GroupContext";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";
import { toast } from "react-toastify";
import { Button, Spinner, Alert, Card } from "react-bootstrap";
import {
  FaArrowLeft,
  FaChalkboardTeacher,
  FaUserPlus,
  FaTrashAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import MembersList from "../Members/MembersList";
// Assumiamo che queste siano ancora nel percorso ../Modals/
import InviteMembersModal from "../Modals/InviteMembersModal";
import ConfirmDeleteGroupModal from "../Modals/ConfirmDeleteGroupModal";
// Import della modale dalla stessa cartella
import ConfirmLeaveGroupModal from "./ConfirmLeaveGroupModal"; // <-- PATH AGGIORNATO
import authService from "../../../services/authService";
import jwt_decode from "jwt-decode";
import "./GroupDetail.css";

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const {
    currentGroup,
    members,
    boards: groupBoards,
    loading: groupLoading,
    fetchGroupDetails,
    deleteCurrentUserGroup,
    leaveCurrentGroup,
  } = useGroup();

  // Stati Modali
  const [showInviteModal, setShowInviteModal] = useState(false);
  const handleShowInviteModal = () => setShowInviteModal(true);
  const handleCloseInviteModal = () => setShowInviteModal(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const handleShowDeleteConfirmModal = () => setShowDeleteConfirmModal(true);
  const handleCloseDeleteConfirmModal = () => setShowDeleteConfirmModal(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const handleShowLeaveConfirmModal = () => setShowLeaveConfirmModal(true);
  const handleCloseLeaveConfirmModal = () => setShowLeaveConfirmModal(false);

  // Stato Fetch
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const stableFetchGroupDetails = useCallback(fetchGroupDetails, [
    fetchGroupDetails,
  ]);

  // Stato per Zona Pericolo
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = useState(false);

  const loggedInUserId = useMemo(() => {
    const token = authService.getToken();
    if (!token) return null;
    try {
      const decoded = jwt_decode(token);
      return decoded?.id ?? null;
    } catch (error) {
      console.error("Errore decodifica token in GroupDetail:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    setDetailsLoaded(false);
    setIsDangerZoneExpanded(false);
    const numericGroupId = parseInt(groupId);
    if (!isNaN(numericGroupId) && numericGroupId > 0) {
      stableFetchGroupDetails(numericGroupId)
        .then(() => {
          setDetailsLoaded(true);
        })
        .catch((err) => {
          if (err.response?.status !== 401) {
            toast.error(err.message || "Errore caricamento.");
          }
          setDetailsLoaded(true);
          if (err.response?.status === 404 || err.response?.status === 403) {
            navigate("/groups-dashboard", { replace: true });
          }
        });
    } else {
      toast.error("ID gruppo non valido.");
      navigate("/groups-dashboard", { replace: true });
    }
  }, [groupId, navigate, stableFetchGroupDetails]);

  // Click su Elimina (invariato)
  const handleDeleteGroupClick = () => {
    const isAdminClick = currentGroup?.currentUserRole === "admin";
    if (!isAdminClick) {
      toast.error("Azione non permessa.");
      return;
    }
    if (loggedInUserId === null) {
      toast.error("Impossibile verificare l'identità (ID utente non trovato).");
      return;
    }
    if (!members || !Array.isArray(members)) {
      toast.error("Errore: dati membri non disponibili.");
      return;
    }
    if (members.length > 1) {
      toast.warn(
        "Puoi eliminare il gruppo solo quando sei l'unico membro rimasto.",
        { autoClose: 5000 }
      );
    } else if (
      members.length === 1 &&
      String(members[0]?.id) === String(loggedInUserId)
    ) {
      handleShowDeleteConfirmModal();
    } else {
      toast.error(
        "Errore: Condizioni per l'eliminazione non soddisfatte (ID utente non corrisponde?)."
      );
    }
  };

  // Esecuzione Eliminazione (invariata)
  const executeDeleteGroup = async () => {
    const isAdminExec = currentGroup?.currentUserRole === "admin";
    if (
      !isAdminExec ||
      !currentGroup ||
      !Array.isArray(members) ||
      members.length !== 1 ||
      loggedInUserId === null ||
      String(members[0]?.id) !== String(loggedInUserId)
    ) {
      toast.error(
        "Condizioni non soddisfatte per l'esecuzione dell'eliminazione."
      );
      handleCloseDeleteConfirmModal();
      return;
    }
    try {
      await deleteCurrentUserGroup(groupId);
      toast.success(`Gruppo "${currentGroup.name}" eliminato.`);
      navigate("/groups-dashboard", { replace: true });
    } catch (error) {
      handleCloseDeleteConfirmModal();
    }
  };

  // Logica Abbandona Gruppo (invariata)
  const handleLeaveGroupClick = () => {
    if (!currentGroup || !members || loggedInUserId === null) {
      toast.error("Dati utente/gruppo non disponibili.");
      return;
    }
    const currentUserRole = currentGroup.currentUserRole;
    const adminCount = members.filter((m) => m.role === "admin").length;
    if (currentUserRole === "admin" && adminCount === 1) {
      toast.warn(
        "Sei l'unico amministratore. Promuovi un altro membro prima di abbandonare il gruppo.",
        { autoClose: 6000 }
      );
      return;
    }
    handleShowLeaveConfirmModal();
  };

  // Funzione eseguita dalla modale di conferma abbandono (invariata)
  const executeLeaveGroup = async () => {
    if (!currentGroup) return;
    const success = await leaveCurrentGroup(groupId);
    if (success) {
      navigate("/groups-dashboard", { replace: true });
    } else {
      handleCloseLeaveConfirmModal();
    }
  };

  if (groupLoading || !detailsLoaded) {
    return (
      <div className="loading-placeholder-page">
        {" "}
        <LoadingSpinner />{" "}
      </div>
    );
  }
  if (!currentGroup) {
    return (
      <div className="container mt-4">
        {" "}
        <Alert variant="warning" className="text-center">
          {" "}
          <Alert.Heading as="h4" className="font-primary">
            {" "}
            Gruppo non Trovato{" "}
          </Alert.Heading>{" "}
          <hr />{" "}
          <Link to="/groups-dashboard" className="alert-link font-secondary">
            {" "}
            Torna ai Miei Gruppi{" "}
          </Link>{" "}
        </Alert>{" "}
      </div>
    );
  }

  // Calcolo variabili per il rendering (invariato)
  const isAdmin = currentGroup?.currentUserRole === "admin";
  const validMembersData = Array.isArray(members) ? members : [];
  const firstMemberId =
    validMembersData.length > 0 ? validMembersData[0]?.id : undefined;
  const adminCount = validMembersData.filter((m) => m.role === "admin").length;
  const canDeleteGroup =
    isAdmin &&
    validMembersData.length === 1 &&
    loggedInUserId != null &&
    firstMemberId != null &&
    String(firstMemberId) === String(loggedInUserId);
  const canLeaveGroup = (isAdmin && adminCount > 1) || !isAdmin;

  return (
    <div className="group-detail-container">
      <header className="group-detail-header">
        <div className="header-left">
          <Button
            variant="link"
            onClick={() => navigate("/groups-dashboard")}
            className="back-button"
            title="Torna ai Gruppi"
          >
            {" "}
            <FaArrowLeft />{" "}
          </Button>
          <h1 className="group-name-title font-primary text-shadow-chalk">
            {" "}
            {currentGroup.name}{" "}
          </h1>
        </div>
        <div className="header-actions">
          <Button
            variant="outline-secondary"
            size="sm"
            className="leave-group-btn font-secondary"
            onClick={handleLeaveGroupClick}
            disabled={!canLeaveGroup}
            title={
              canLeaveGroup
                ? "Abbandona questo gruppo"
                : "Non puoi abbandonare ora (sei l'unico admin?)"
            }
          >
            {" "}
            <FaSignOutAlt className="me-1" /> Abbandona{" "}
          </Button>
          {Array.isArray(groupBoards) && groupBoards.length > 0 && (
            <Button
              variant="outline-primary"
              size="sm"
              className="view-boards-btn font-secondary"
              onClick={() => {
                const defaultBoard = groupBoards.find(
                  (b) => b.is_group_default
                );
                const boardToNavigate = defaultBoard || groupBoards[0];
                if (boardToNavigate) {
                  navigate(`/groups/${groupId}/boards/${boardToNavigate.id}`);
                } else {
                  toast.info("Nessuna lavagna disponibile in questo gruppo.");
                }
              }}
            >
              {" "}
              <FaChalkboardTeacher className="me-1" /> Vedi Lavagne{" "}
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="success"
              size="sm"
              onClick={handleShowInviteModal}
              className="invite-btn font-secondary"
              title="Invita nuovi membri"
            >
              {" "}
              <FaUserPlus className="me-1" /> Invita{" "}
            </Button>
          )}
        </div>
      </header>

      <Card className="mb-4 shadow-sm members-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          {" "}
          <span className="font-primary">
            Membri ({validMembersData.length})
          </span>{" "}
          {groupLoading && (
            <Spinner animation="border" size="sm" variant="secondary" />
          )}{" "}
        </Card.Header>
        <Card.Body className="p-0">
          {" "}
          {!groupLoading && currentGroup && validMembersData.length > 0 ? (
            <MembersList
              groupData={currentGroup}
              groupMembers={validMembersData}
              currentUserId={loggedInUserId}
            />
          ) : !groupLoading ? (
            <p className="text-muted p-3 mb-0 font-secondary">
              {" "}
              Nessun membro trovato.{" "}
            </p>
          ) : null}{" "}
        </Card.Body>
      </Card>

      {isAdmin && (
        <Card border="danger" className="danger-zone-card">
          <Card.Header
            className="bg-danger text-white font-secondary danger-zone-header"
            onClick={() => setIsDangerZoneExpanded(true)}
            style={{ cursor: "pointer" }}
            aria-expanded={isDangerZoneExpanded}
            aria-controls="danger-zone-content"
          >
            {" "}
            <FaTrashAlt className="me-2" /> Zona Pericolo (Elimina Gruppo){" "}
          </Card.Header>
          {isDangerZoneExpanded && (
            <Card.Body className="text-center" id="danger-zone-content">
              {" "}
              <Button
                variant="outline-danger"
                onClick={handleDeleteGroupClick}
                className="delete-group-btn font-secondary"
                disabled={!canDeleteGroup}
                title={
                  canDeleteGroup
                    ? `Elimina gruppo ${currentGroup.name}`
                    : "Non puoi eliminare il gruppo ora"
                }
              >
                {" "}
                Elimina Gruppo "{currentGroup.name}"{" "}
              </Button>{" "}
              {isAdmin && !canDeleteGroup && validMembersData.length > 1 && (
                <small className="d-block text-muted mt-2 font-secondary">
                  {" "}
                  Puoi eliminarlo solo quando sei l'unico membro.{" "}
                </small>
              )}{" "}
            </Card.Body>
          )}
        </Card>
      )}

      {/* Modali */}
      {isAdmin && (
        <InviteMembersModal
          show={showInviteModal}
          handleClose={handleCloseInviteModal}
          groupId={groupId}
        />
      )}
      {isAdmin && (
        <ConfirmDeleteGroupModal
          show={showDeleteConfirmModal}
          handleClose={handleCloseDeleteConfirmModal}
          groupName={currentGroup?.name || "..."}
          onConfirm={executeDeleteGroup}
        />
      )}
      {/* USA L'IMPORT LOCALE */}
      <ConfirmLeaveGroupModal
        show={showLeaveConfirmModal}
        handleClose={handleCloseLeaveConfirmModal}
        groupName={currentGroup?.name || "..."}
        onConfirm={executeLeaveGroup}
      />
    </div>
  );
};

export default GroupDetail;
