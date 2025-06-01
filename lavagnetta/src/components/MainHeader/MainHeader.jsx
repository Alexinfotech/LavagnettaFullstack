/* ==== src/components/MainHeader/MainHeader.jsx (v2 - Aggiunto onClick per showSubHeader) ==== */
import React, { useState, useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import { useGroup } from "../../contexts/GroupContext";
import authService from "../../services/authService";
import jwt_decode from "jwt-decode";
import { FaBell, FaUsers, FaSignOutAlt, FaTh } from "react-icons/fa";
import Notifications from "../Notifications/Notifications";
import "./MainHeader.css";

// Accetta la nuova prop onHeaderClick
const MainHeader = ({ onHeaderClick }) => {
  const { unreadNotificationCount } = useGroup();
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  const username = useMemo(() => {
    const token = localStorage.getItem("token");
    if (!token) return "Utente";
    try {
      const decoded = jwt_decode(token);
      return decoded?.username || "Utente";
    } catch (error) {
      console.error("Errore decodifica token in MainHeader:", error);
      return "Utente";
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  const handleToggleNotifications = () => {
    setShowNotificationsPanel((prev) => !prev);
  };

  // Handler per il click sull'header (chiama la prop)
  const handleHeaderClick = (e) => {
    // Evita di triggerare se si clicca su un bottone/link interno all'header
    if (e.target === e.currentTarget && typeof onHeaderClick === "function") {
      // console.log("MainHeader clicked, calling onHeaderClick (showSubHeader)");
      onHeaderClick();
    }
  };

  if (!authService.isLoggedIn()) {
    return null;
  }

  return (
    <>
      {/* Aggiunto onClick all'elemento header */}
      <header
        className="main-header"
        onClick={handleHeaderClick}
        style={{ cursor: "pointer" }}
        title="Clicca per mostrare/nascondere header secondario"
      >
        {/* Logo */}
        <div className="main-header__logo">
          {/* Impedisci al click sul logo di propagare all'header */}
          <Link
            to="/dashboard"
            title="Vai alla Dashboard Principale"
            onClick={(e) => e.stopPropagation()}
          >
            Lavagnetta
          </Link>
        </div>
        {/* Navigazione */}
        {/* Impedisci al click sulla nav di propagare all'header */}
        <nav className="main-header__nav" onClick={(e) => e.stopPropagation()}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `main-header__nav-link ${isActive ? "active" : ""}`
            }
            title="Dashboard Personale"
          >
            <FaTh className="main-header__nav-icon react-icon" />
            <span className="main-header__nav-text">Dashboard</span>
          </NavLink>
          <NavLink
            to="/groups-dashboard"
            className={({ isActive }) =>
              `main-header__nav-link ${isActive ? "active" : ""}`
            }
            title="I Miei Gruppi"
          >
            <FaUsers className="main-header__nav-icon react-icon" />
            <span className="main-header__nav-text">Gruppi</span>
          </NavLink>
        </nav>
        {/* Azioni Utente */}
        {/* Impedisci al click sulle azioni di propagare all'header */}
        <div
          className="main-header__actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="main-header__action-button notification-button"
            onClick={handleToggleNotifications} // Questo click è gestito internamente
            title="Notifiche"
            aria-label={`Notifiche ${unreadNotificationCount > 0 ? `(${unreadNotificationCount} non lette)` : ""}`}
          >
            <FaBell className="react-icon" />
            {unreadNotificationCount > 0 && (
              <span className="main-header-badge">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          <div className="main-header__user-info">
            <span
              className="main-header__username"
              title={`Utente: ${username}`}
            >
              {username}
            </span>
          </div>

          <button
            className="main-header__action-button logout-button"
            onClick={handleLogout} // Questo click è gestito internamente
            title="Logout"
            aria-label="Logout"
          >
            <FaSignOutAlt className="react-icon" />
          </button>
        </div>
      </header>

      {/* Pannello Notifiche */}
      {showNotificationsPanel && (
        <Notifications onClose={handleToggleNotifications} />
      )}
    </>
  );
};

export default MainHeader;
//ok
//funzionante
