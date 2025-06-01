/* ==== src/components/GroupDashboard/Members/MembersList.jsx (v10 - Fix Controllo Props Iniziale) ==== */
import React, { useState } from "react"; // Rimosso useMemo non usato nel tuo v6
import { useGroup } from "../../../contexts/GroupContext";
import {
  FaCrown,
  FaUserCog,
  FaUserEdit,
  FaExclamationCircle,
} from "react-icons/fa"; // Usate
import { toast } from "react-toastify"; // Usato
import { Form, Spinner as BootstrapSpinner } from "react-bootstrap"; // Usati
import "./MembersList.css";

const availableRoles = [
  { value: "admin", label: "Admin", Icon: FaCrown },
  { value: "level1", label: "Editor", Icon: FaUserCog },
  { value: "level2", label: "Contributor", Icon: FaUserEdit },
];

// Riceve groupData, groupMembers, currentUserId come PROPS
const MembersList = ({ groupData, groupMembers, currentUserId }) => {
  const { updateMemberRole, requestRoleChange } = useGroup(); // Usate

  const [loadingUserId, setLoadingUserId] = useState(null); // Usato
  const [errorUserId, setErrorUserId] = useState(null); // Usato

  const loggedInUserId = currentUserId; // Usa prop
  // Legge currentGroup dal context solo per queste due info necessarie negli handler/rendering
  const isCurrentUserAdmin = groupData?.currentUserRole === "admin";
  const creatorId = groupData?.created_by;

  // handleRoleChange è usata
  const handleRoleChange = async (member, newRole) => {
    if (
      !groupData?.id ||
      !member ||
      !newRole ||
      member.role === newRole ||
      !isCurrentUserAdmin ||
      member.id === loggedInUserId
    ) {
      return;
    } // Usa groupData.id
    const memberId = member.id;
    const currentRole = member.role;
    const isDemotingAdmin =
      currentRole === "admin" && ["level1", "level2"].includes(newRole);
    const targetIsCreator = member.id === creatorId; // Usa creatorId
    if (targetIsCreator && !isDemotingAdmin) {
      toast.warn(
        "Il ruolo del creatore non può essere modificato direttamente."
      );
      return;
    } // Usa toast
    setLoadingUserId(memberId); // Usa setLoadingUserId
    setErrorUserId(null); // Usa setErrorUserId
    try {
      if (isDemotingAdmin) {
        await requestRoleChange(groupData.id, memberId, newRole);
      } // Usa requestRoleChange
      else {
        await updateMemberRole(groupData.id, memberId, newRole);
        toast.success(`Ruolo aggiornato per ${member.username}!`);
      } // Usa updateMemberRole, toast
    } catch (error) {
      console.error(`Errore cambio ruolo per ${memberId}:`, error);
      setErrorUserId(memberId);
    } finally {
      // Usa setErrorUserId
      setLoadingUserId(null);
    } // Usa setLoadingUserId
  };

  // getRoleIcon è usata
  const getRoleIcon = (role) => {
    const roleInfo = availableRoles.find((r) => r.value === role);
    if (roleInfo) {
      const { Icon, label } = roleInfo;
      return <Icon className={`role-icon role-icon--${role}`} title={label} />;
    }
    return null;
  };

  // --- Rendering Lista ---
  // *** CONTROLLO PROP CORRETTO: Verifica solo che groupData e groupMembers (come array) siano validi ***
  // Il controllo su loggedInUserId viene fatto DOPO, prima di usarlo nei confronti
  if (!groupData || !Array.isArray(groupMembers)) {
    console.error(
      "[MembersList] Props groupData o groupMembers mancanti/non valide:",
      { groupData, groupMembers }
    );
    // Mostra un messaggio di errore più specifico o un fallback
    return (
      <div className="text-danger p-3">
        Errore interno: dati membri non disponibili.
      </div>
    );
  }
  // Il caso groupMembers.length === 0 è gestito da GroupDetail, qui non serve ritornare null

  return (
    <div className="members-list-container">
      {/* MAP su groupMembers (dalle props) */}
      {groupMembers.map((member) => {
        // Determina se l'utente loggato è questo membro (controlla se loggedInUserId è valido)
        const isSelf =
          loggedInUserId !== null &&
          typeof loggedInUserId !== "undefined" &&
          member.id === loggedInUserId;
        // Determina se l'utente corrente può TENTARE di modificare il ruolo
        const canTryEditRole = isCurrentUserAdmin && !isSelf; // Non puoi modificare te stesso
        // Determina se questo membro è il creatore
        const isCreator = member.id === creatorId;
        // Determina se il select deve essere disabilitato
        const isSelectDisabled = isCreator; // Disabilita sempre per il creatore

        const displayRoleLabel =
          availableRoles.find((r) => r.value === member.role)?.label ||
          member.role; // USATO
        const showSpinner = loadingUserId === member.id;
        const showErrorIcon = errorUserId === member.id && !showSpinner; // USATO

        return (
          // Usa isSelf per la classe CSS
          <div
            key={member.id}
            className={`member-item ${showErrorIcon ? "member-item--error" : ""} ${isSelf ? "member-item--current-user" : ""}`}
          >
            <div className="member-info">
              <div className="role-icon-container">
                {getRoleIcon(member.role)}
              </div>{" "}
              {/* USA getRoleIcon */}
              <div className="member-details">
                <span className="member-name font-primary">
                  {member.username}
                  {/* Usa isSelf per mostrare (Tu) */}
                  {isSelf && (
                    <span className="you-tag font-secondary">(Tu)</span>
                  )}
                </span>
                <span className="member-email font-secondary">
                  {member.email}
                </span>
                {isCreator && (
                  <span className="creator-tag font-secondary ms-2">
                    Creatore
                  </span>
                )}
              </div>
            </div>
            <div className="member-actions">
              {showSpinner && (
                <BootstrapSpinner
                  animation="border"
                  size="sm"
                  variant="secondary"
                  className="action-spinner me-2"
                  title="Caricamento..."
                />
              )}{" "}
              {/* USA BootstrapSpinner */}
              {showErrorIcon && (
                <FaExclamationCircle
                  className="action-error-icon text-danger me-2"
                  title="Errore"
                />
              )}{" "}
              {/* USA FaExclamationCircle */}
              {/* USA canTryEditRole, Form, handleRoleChange, isSelectDisabled */}
              {canTryEditRole && !showSpinner && !showErrorIcon && (
                <Form.Select
                  size="sm"
                  className="role-select font-secondary"
                  value={member.role}
                  disabled={isSelectDisabled}
                  onChange={(e) => handleRoleChange(member, e.target.value)}
                  aria-label={`Cambia ruolo per ${member.username}`}
                  title={
                    isSelectDisabled
                      ? "Ruolo del creatore non modificabile"
                      : member.role === "admin"
                        ? "Richiederà conferma utente"
                        : "Cambia ruolo"
                  }
                >
                  {/* USA Form */}
                  {availableRoles.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </Form.Select>
              )}
              {/* USA canTryEditRole, displayRoleLabel */}
              {(!canTryEditRole || showSpinner || showErrorIcon) && (
                <span
                  className="member-role-badge badge font-secondary"
                  title={displayRoleLabel}
                >
                  {displayRoleLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;
