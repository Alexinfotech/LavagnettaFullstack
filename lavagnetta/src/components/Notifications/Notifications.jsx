/* ==== src/components/Notifications/Notifications.jsx (v4 - Finalizzato) ==== */
import React, { useState } from "react";
import { useGroup } from "../../contexts/GroupContext";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Button, Spinner } from "react-bootstrap";
// Rimosso import LoadingSpinner non usato
// import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import "./Notifications.css";

const Notifications = ({ onClose }) => {
  const {
    notifications,
    loading: contextLoading,
    acceptInvite,
    rejectInvite,
  } = useGroup();

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleAccept = async (notificationId) => {
    setActionLoadingId(notificationId);
    try {
      await acceptInvite(notificationId);
    } catch (error) {
      console.error("Errore accept invite:", error);
    } finally {
      setActionLoadingId(null);
    }
  };
  const handleReject = async (notificationId) => {
    setActionLoadingId(notificationId);
    try {
      await rejectInvite(notificationId);
    } catch (error) {
      console.error("Errore reject invite:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Funzione showActionButtons ripristinata
  const showActionButtons = (notification) => {
    if (!notification || !notification.data) return false;
    // Mostra bottoni per inviti a gruppi O richieste di cambio ruolo
    return (
      notification.data.type === "GROUP_INVITE" ||
      notification.data.type === "ROLE_CHANGE_REQUEST"
    );
  };

  const isLoading = contextLoading;

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div
        className="notifications-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Chiudi notifiche"
        >
          ×
        </button>
        <h2 id="notifications-title" className="font-primary text-accent">
          Notifiche
        </h2>

        <div className="notifications-content">
          {/* Placeholder Loading */}
          {isLoading && notifications.length === 0 ? (
            <div className="loading-placeholder p-4 text-center">
              <Spinner
                animation="border"
                size="sm"
                variant="secondary"
                className="me-1"
              />
              <p className="font-secondary text-muted mt-2 d-inline">
                Caricamento notifiche...
              </p>
            </div>
          ) : // Placeholder Lista Vuota
          !isLoading && notifications.length === 0 ? (
            <p className="no-notifications-message text-center p-4 font-secondary">
              Nessuna nuova notifica.
            </p>
          ) : (
            // Lista Notifiche
            <ul className="notifications-list">
              {notifications.map((notification) => (
                <li key={notification.id} className="notification-item">
                  <p className="notification-message font-secondary mb-2">
                    {notification.message ||
                      "Contenuto notifica non disponibile."}
                  </p>
                  {showActionButtons(notification) && (
                    <div className="notification-actions">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleAccept(notification.id)}
                        disabled={
                          actionLoadingId === notification.id || isLoading
                        }
                        className="font-secondary" // Usa Lato per bottoni
                      >
                        {actionLoadingId === notification.id ? (
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-1"
                          />
                        ) : (
                          <FaCheck />
                        )}
                        Accetta
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleReject(notification.id)}
                        disabled={
                          actionLoadingId === notification.id || isLoading
                        }
                        className="font-secondary" // Usa Lato per bottoni
                      >
                        {actionLoadingId === notification.id ? (
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-1"
                          />
                        ) : (
                          <FaTimes />
                        )}
                        Rifiuta
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
