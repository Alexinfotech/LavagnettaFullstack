// frontend/src/components/GroupDashboard.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBell } from "react-icons/fa";
import { toast } from "react-toastify";
import groupService from "../../services/groupService";
import notificationService from "../../services/notificationService";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import GroupCard from "./GroupCard";
import CreateGroupModal from "./Modals/CreateGroupModal";
import Notifications from "../Notifications/Notifications";
import "./GroupDashboard.css";

const GroupDashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (error) {
      toast.error("Errore nel caricamento dei gruppi");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const notifications = await notificationService.getNotifications();
      const unread = notifications.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Errore nel recupero delle notifiche non lette:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUnreadNotifications();
  }, []);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (showNotifications) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="group-dashboard-container">
      <div className="group-dashboard-header">
        <button
          className="icon-button"
          onClick={handleBackToDashboard}
          aria-label="Torna alla Dashboard"
        >
          <FaHome />
        </button>
        <h1>I Miei Gruppi</h1>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={handleToggleNotifications}
            aria-label="Notifiche"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <button
            className="create-group-button"
            onClick={() => setShowCreateModal(true)}
          >
            Crea Nuovo Gruppo
          </button>
        </div>
      </div>

      <div className="groups-content">
        {loading ? (
          <LoadingSpinner />
        ) : groups.length === 0 ? (
          <div className="no-groups-message">
            <p>Non sei membro di alcun gruppo.</p>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onSelect={() => navigate(`/groups/${group.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newGroup) => setGroups((prev) => [...prev, newGroup])}
        />
      )}

      {showNotifications && (
        <Notifications onClose={handleToggleNotifications} />
      )}
    </div>
  );
};

export default GroupDashboard;
//ultimo ok
