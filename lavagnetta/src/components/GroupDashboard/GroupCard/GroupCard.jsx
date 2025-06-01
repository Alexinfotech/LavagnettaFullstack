/* ==== src/components/GroupDashboard/GroupCard/GroupCard.jsx (VERIFICATO E PRONTO) ==== */
import React from "react";
import { FaUsers, FaChalkboard } from "react-icons/fa"; // Icone per stats
import "./GroupCard.css"; // Importa CSS per la card

const GroupCard = ({ group, onSelect }) => {
  // Placeholder se i dati del gruppo non sono validi
  if (!group || !group.id || !group.name) {
    console.warn("GroupCard: Dati gruppo non validi ricevuti:", group);
    return (
      <div className="group-card group-card--invalid">
        {" "}
        {/* Classe per stile errore */}
        <h3 className="font-primary">Errore Dati</h3>
        <p className="font-secondary text-medium-gray">
          Impossibile caricare il gruppo.
        </p>
      </div>
    );
  }

  // Determina testo plurale
  const memberCount = group.memberCount || 0; // Fallback a 0 se non presente
  const boardCount = group.boardCount || 0; // Fallback a 0 se non presente
  const memberText = memberCount === 1 ? "membro" : "membri";
  const boardText = boardCount === 1 ? "lavagna" : "lavagne";

  return (
    // Card cliccabile
    <div
      className="group-card"
      onClick={onSelect}
      role="button"
      tabIndex={0} // Rende focusabile con tastiera
      onKeyPress={(e) => e.key === "Enter" && onSelect()} // Attiva con Invio
      title={`Vai al gruppo ${group.name}`}
    >
      {/* Titolo Card (Caveat) */}
      <h3
        className="group-card__title font-primary text-shadow-chalk"
        title={group.name}
      >
        {group.name}
      </h3>

      {/* Statistiche (Lato) */}
      <div className="group-card__stats font-secondary">
        <div className="stat">
          <FaUsers className="stat__icon" /> {/* Icona Membri */}
          <span className="stat__text">
            {memberCount} {memberText}
          </span>
        </div>
        <div className="stat">
          <FaChalkboard className="stat__icon" /> {/* Icona Lavagne */}
          <span className="stat__text">
            {boardCount} {boardText}
          </span>
        </div>
      </div>

      {/* Ruolo Utente (Lato, in basso) */}
      <div className="group-card__role font-secondary">
        Il tuo ruolo: <span className="role-value">{group.role || "N/D"}</span>
      </div>
    </div> // Fine group-card
  );
};

export default GroupCard;
