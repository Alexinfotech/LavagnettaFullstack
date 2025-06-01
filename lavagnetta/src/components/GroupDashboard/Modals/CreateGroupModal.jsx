import React, { useState } from "react";
import { validateEmails } from "../../../utils/validation";
import { toast } from "react-toastify";
import groupService from "../../../services/groupService";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";
import "./CreateGroupModal.css";

const CreateGroupModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    groupName: "",
    emails: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.groupName.trim()) {
      newErrors.groupName = "Il nome del gruppo è obbligatorio";
    }

    if (formData.emails) {
      const emailList = formData.emails.split(",").map((email) => email.trim());
      const invalidEmails = validateEmails(emailList);
      if (invalidEmails.length > 0) {
        newErrors.emails = `Email non valide: ${invalidEmails.join(", ")}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const emailList = formData.emails
        ? formData.emails.split(",").map((email) => email.trim())
        : [];

      const response = await groupService.createGroup({
        name: formData.groupName,
        members: emailList,
      });

      onCreated(response.data);
      toast.success("Gruppo creato con successo!");
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Errore nella creazione del gruppo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <h2>Crea Nuovo Gruppo</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome Gruppo</label>
                <input
                  type="text"
                  value={formData.groupName}
                  onChange={(e) =>
                    setFormData({ ...formData, groupName: e.target.value })
                  }
                  className={errors.groupName ? "error" : ""}
                />
                {errors.groupName && (
                  <span className="error-text">{errors.groupName}</span>
                )}
              </div>
              <div className="form-group">
                <label>Email membri (separati da virgola)</label>
                <textarea
                  value={formData.emails}
                  onChange={(e) =>
                    setFormData({ ...formData, emails: e.target.value })
                  }
                  className={errors.emails ? "error" : ""}
                  placeholder="email1@example.com, email2@example.com"
                />
                {errors.emails && (
                  <span className="error-text">{errors.emails}</span>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={onClose} disabled={loading}>
                  Annulla
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Creazione..." : "Crea Gruppo"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateGroupModal;
