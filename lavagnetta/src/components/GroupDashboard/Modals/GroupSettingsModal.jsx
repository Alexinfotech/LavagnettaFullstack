import React, { useState } from "react";
import { useGroup } from "../../../contexts/GroupContext";
import { toast } from "react-toastify";
import api from "../../../services/api";
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
      const response = await api.put(`/groups/${currentGroup.id}`, {
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
          {/* Additional settings */}
        </form>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
