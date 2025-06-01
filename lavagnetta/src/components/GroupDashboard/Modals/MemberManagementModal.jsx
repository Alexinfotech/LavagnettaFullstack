import React, { useState } from "react";
import { useGroup } from "../../../contexts/GroupContext";
import { toast } from "react-toastify";
import api from "../../../services/api";
import "./MemberManagementModal.css";

const MemberManagementModal = ({ onClose }) => {
  const { currentGroup, members, setMembers } = useGroup();
  const [selectedMember, setSelectedMember] = useState(null);
  const [newRole, setNewRole] = useState("");

  const handleRoleUpdate = async () => {
    if (!selectedMember || !newRole) return;

    try {
      await api.put(
        `/groups/${currentGroup.id}/members/${selectedMember.id}/role`,
        {
          role: newRole,
        }
      );

      setMembers((prev) =>
        prev.map((member) =>
          member.id === selectedMember.id
            ? { ...member, role: newRole }
            : member
        )
      );

      toast.success("Ruolo aggiornato con successo");
      setSelectedMember(null);
      setNewRole("");
    } catch (error) {
      toast.error("Errore nell'aggiornamento del ruolo");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content member-management-modal">
        <h2>Gestione Membri</h2>
        <div className="members-table">
          {/* Members table with role management */}
        </div>
      </div>
    </div>
  );
};

export default MemberManagementModal;
