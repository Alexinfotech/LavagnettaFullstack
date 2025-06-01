import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { useGroup } from "../../../contexts/GroupContext";
import "./CreateBoardModal.css";

const CreateBoardModal = ({ onClose }) => {
  const { currentGroup, setBoards } = useGroup();
  const [boardName, setBoardName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boardName.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/groups/${currentGroup.id}/boards`, {
        name: boardName,
      });

      setBoards((prev) => [...prev, response.data]);
      toast.success("Lavagna creata con successo!");
      onClose();
    } catch (error) {
      toast.error("Errore nella creazione della lavagna");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crea Nuova Lavagna</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Lavagna</label>
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              required
              placeholder="Inserisci il nome della lavagna"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Annulla
            </button>
            <button type="submit" disabled={loading || !boardName.trim()}>
              {loading ? "Creazione..." : "Crea Lavagna"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
