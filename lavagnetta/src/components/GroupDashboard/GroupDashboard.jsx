/* ==== src/components/GroupDashboard/GroupDashboard.jsx (Info Permessi con Modale) ==== */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Importa icone necessarie + FaInfoCircle
import { FaHome, FaBell, FaPlus, FaInfoCircle } from "react-icons/fa";
import { Modal, Button } from "react-bootstrap"; // *** Importa Modal e Button ***
import { useGroup } from "../../contexts/GroupContext";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import GroupCard from "./GroupCard/GroupCard"; // Verifica questo percorso!
import CreateGroupModal from "./CreateGroupModal/CreateGroupModal"; // Verifica questo percorso!
import Notifications from "../Notifications/Notifications";
import PermissionLegend from "./PermissionLegend"; // *** Importa Legenda (Verifica Percorso!) ***
import "./GroupDashboard.css";

const GroupDashboard = () => {
  const navigate = useNavigate();
  const {
    groups: contextGroups,
    loading: contextLoading,
    unreadNotificationCount,
    fetchGroups,
  } = useGroup();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(contextLoading);
  const [showLegendModal, setShowLegendModal] = useState(false); // *** Stato per la modale legenda ***

  useEffect(() => {
    if (!contextLoading && (!contextGroups || contextGroups.length === 0)) {
      setLoadingInitial(true);
      fetchGroups().catch((err) => {
        console.error("[GroupDashboard Effect] Fetch fallito:", err);
      });
      // .finally(() => { setLoadingInitial(false); }); // contextLoading gestirà
    } else {
      setLoadingInitial(contextLoading);
    }
  }, [fetchGroups, contextLoading, contextGroups]);

  const handleBackToDashboard = () => navigate("/dashboard");
  const handleToggleNotifications = () =>
    setShowNotificationsPanel((prev) => !prev);
  const handleCloseNotifications = () => setShowNotificationsPanel(false);
  const handleGroupSelect = (groupId, defaultBoardId) => {
    if (defaultBoardId) {
      navigate(`/groups/${groupId}/boards/${defaultBoardId}`);
    } else {
      console.warn(
        `[GroupDashboard] Default board ID non trovato per gruppo ${groupId}.`
      );
      navigate(`/groups/${groupId}`);
    }
  };
  const handleOpenCreateModal = () => setShowCreateModal(true);
  const handleCloseCreateModal = () => setShowCreateModal(false);

  // *** Handlers per la modale legenda ***
  const handleShowLegendModal = () => setShowLegendModal(true);
  const handleCloseLegendModal = () => setShowLegendModal(false);
  // *** --- ***

  const isLoading = contextLoading;

  return (
    <div className="group-dashboard-container">
      {/* Header Pagina */}
      <div className="group-dashboard-header">
        <button
          className="btn-icon-header"
          onClick={handleBackToDashboard}
          title="Dashboard Personale"
          aria-label="Dashboard Personale"
        >
          {" "}
          <FaHome />{" "}
        </button>
        <h1 className="font-primary text-shadow-chalk">I Miei Gruppi</h1>
        <div className="header-actions">
          {/* *** Pulsante Info Legenda *** */}
          <button
            className="btn-icon-header info-button" // Classe per styling opzionale
            onClick={handleShowLegendModal}
            title="Informazioni sui Permessi dei Ruoli"
            aria-label="Informazioni sui Permessi dei Ruoli"
          >
            <FaInfoCircle />
          </button>
          {/* *** --- *** */}
          <button
            className="btn-icon-header notification-button"
            onClick={handleToggleNotifications}
            title="Notifiche"
            aria-label={`Notifiche ${unreadNotificationCount > 0 ? `(${unreadNotificationCount} non lette)` : ""}`}
          >
            <FaBell />
            {unreadNotificationCount > 0 && (
              <span className="notification-badge">
                {unreadNotificationCount}
              </span>
            )}
          </button>
          <button
            className="btn btn-primary create-group-button font-primary d-flex align-items-center"
            onClick={handleOpenCreateModal}
            title="Crea Nuovo Gruppo"
          >
            <FaPlus className="me-1" /> <span>Crea Gruppo</span>
          </button>
        </div>
      </div>

      {/* ---- RIMOSSO ACCORDION ---- */}

      {/* Contenuto Principale */}
      <div className="groups-content">
        {isLoading ? (
          <div className="loading-placeholder">
            {" "}
            <LoadingSpinner text="Caricamento gruppi..." />{" "}
          </div>
        ) : !contextGroups || contextGroups.length === 0 ? (
          <div className="no-groups-message">
            <p className="font-primary">Non fai parte di nessun gruppo...</p>
            <p className="mt-2">
              <button
                className="btn btn-success"
                onClick={handleOpenCreateModal}
              >
                <FaPlus className="me-1" /> Crea il tuo primo gruppo!
              </button>
            </p>
          </div>
        ) : (
          <div className="groups-grid">
            {contextGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onSelect={() =>
                  handleGroupSelect(group.id, group.defaultBoardId)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modali */}
      <CreateGroupModal
        show={showCreateModal}
        handleClose={handleCloseCreateModal}
      />
      {showNotificationsPanel && (
        <Notifications onClose={handleCloseNotifications} />
      )}

      {/* *** Modale Legenda Permessi *** */}
      <Modal
        show={showLegendModal}
        onHide={handleCloseLegendModal}
        centered // Centra la modale verticalmente
        dialogClassName="modal-lg" // Rendi la modale un po' più larga (opzionale)
        className="permission-legend-modal" // Classe per styling specifico della modale
      >
        <Modal.Header closeButton closeVariant="white">
          {" "}
          {/* Pulsante chiusura bianco */}
          <Modal.Title as="h5">Legenda Permessi Ruoli Gruppo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Inserisci il componente legenda nel corpo */}
          <PermissionLegend />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseLegendModal}>
            Chiudi
          </Button>
        </Modal.Footer>
      </Modal>
      {/* *** --- *** */}
    </div>
  );
};

export default GroupDashboard;
