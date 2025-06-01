import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { useGroup } from "../../../contexts/GroupContext";
import "./GroupSettingsModal.css";

const GroupSettingsModal = ({ onClose }) => {
  const { currentGroup, setCurrentGroup } = useGroup();
  const [groupName, setGroupName] = useState(currentGroup?.name || "");
  const [defaultBoardId, setDefaultBoardId] = useState(
    currentGroup?.defaultBoardId
  );

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      // Rotta aggiornata con /auth
      const response = await api.put(`/auth/groups/${currentGroup.id}`, {
        name: groupName,
        defaultBoardId,
      });

      setCurrentGroup(response.data);
      toast.success("Impostazioni salvate con successo");
      onClose();
    } catch (error) {
      toast.error("Errore nel salvataggio delle impostazioni");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        <h2>Impostazioni Gruppo</h2>
        <form onSubmit={handleSaveSettings}>
          <div className="form-group">
            <label>Nome Gruppo</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Annulla
            </button>
            <button type="submit">Salva</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
