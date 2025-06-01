//frontend/src/components/GroupDashboard/Members/MemberManagement.jsx

import React, { useState } from "react";
import { useGroup } from "../../../contexts/GroupContext";
import { toast } from "react-toastify";
import groupService from "../../../services/groupService";
import "./MemberManagement.css";

const availableRoles = [
  { value: "admin", label: "Admin" },
  { value: "level1", label: "Livello 1" },
  { value: "level2", label: "Livello 2" },
];

const MemberManagement = () => {
  const { currentGroup, members, setMembers, currentUserRole } = useGroup();
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("level2");

  const isAdmin = currentUserRole === "admin";

  const handleRoleChange = async (memberId, newRole) => {
    if (!isAdmin) return;
    try {
      await groupService.updateMemberRole(currentGroup.id, memberId, newRole);
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
      toast.success("Ruolo aggiornato con successo");
    } catch (error) {
      toast.error("Errore nell'aggiornamento del ruolo");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin) return;
    if (!window.confirm("Sei sicuro di voler rimuovere questo membro?")) return;

    try {
      await groupService.removeMember(currentGroup.id, memberId);
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      toast.success("Membro rimosso con successo");
    } catch (error) {
      toast.error("Errore nella rimozione del membro");
    }
  };

  const handleInviteMember = async () => {
    if (!isAdmin) {
      toast.error("Non hai i permessi per invitare membri.");
      return;
    }

    if (!newMemberEmail) {
      toast.error("Inserisci un'email valida");
      return;
    }

    try {
      await groupService.inviteMembers(currentGroup.id, [
        { email: newMemberEmail.trim(), role: newMemberRole },
      ]);
      toast.success("Invito inviato con successo");
      setNewMemberEmail("");
      setNewMemberRole("level2");
    } catch (error) {
      toast.error("Errore nell'invio dell'invito");
    }
  };

  return (
    <div className="member-management">
      <h2>Membri del Gruppo</h2>

      {isAdmin && (
        <div className="invite-member">
          <input
            type="email"
            placeholder="Email del nuovo membro"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value)}
          >
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button onClick={handleInviteMember}>Invita</button>
        </div>
      )}

      <div className="members-list">
        {members.map((member) => (
          <div key={member.id} className="member-item">
            <div className="member-info">
              <span className="member-name">{member.username}</span>
              <span className="member-email">{member.email}</span>
            </div>
            <div className="member-actions">
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                disabled={!isAdmin || member.id === currentGroup.created_by}
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {isAdmin && member.id !== currentGroup.created_by && (
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Rimuovi
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberManagement;
