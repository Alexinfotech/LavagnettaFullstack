// src/components/GroupDashboard/PermissionLegend.jsx (Versione con Classi CSS per Stile)
import React from "react";
import "./PermissionLegend.css"; // Importa il CSS specifico per questo componente

const PermissionLegend = () => {
  return (
    // Usiamo un div contenitore a cui possiamo applicare padding se necessario
    <div className="permission-legend-content">
      <h5>Legenda Permessi Ruoli Gruppo</h5>
      <p className="legend-intro">
        {" "}
        {/* Classe specifica per introduzione */}
        Ogni membro di un gruppo ha un ruolo che definisce cosa può fare
        all'interno delle lavagne del gruppo.
      </p>
      <hr className="legend-hr" /> {/* Classe specifica per HR */}
      {/* Sezione Admin */}
      <div className="role-section">
        <strong className="role-title role-admin">
          👑 Amministratore (Admin)
        </strong>{" "}
        {/* Classe per titolo e colore */}
        <p className="role-description">
          L'amministratore ha il controllo completo sul gruppo e sulle sue
          lavagne.
        </p>
        <ul className="role-permissions">
          {" "}
          {/* Classe per lista permessi */}
          <li>
            <strong>Gestione Gruppo:</strong> PUÒ modificare nome,
            invitare/rimuovere membri, cambiare ruoli, trasferire proprietà,
            eliminare il gruppo (se unico membro).
          </li>
          <li>
            <strong>Gestione Lavagne:</strong> PUÒ creare nuove lavagne,
            rinominare/eliminare qualsiasi lavagna (tranne quella di default).
          </li>
          <li>
            <strong>Gestione Prodotti (Su qualsiasi lavagna):</strong> PUÒ
            aggiungere, modificare nomi (long press), eliminare,
            segnare/deselezionare prodotti.
          </li>
          <li>
            <strong>Personalizzazione:</strong> PUÒ cambiare il proprio sfondo
            personale per qualsiasi lavagna.
          </li>
        </ul>
      </div>
      <hr className="legend-hr" />
      {/* Sezione Editor */}
      <div className="role-section">
        <strong className="role-title role-editor">✏️ Editor (Level 1)</strong>
        <p className="role-description">
          L'editor può gestire completamente i contenuti delle lavagne.
        </p>
        <ul className="role-permissions">
          <li>
            <strong>Gestione Gruppo:</strong> Nessuna azione.
          </li>
          <li>
            <strong>Gestione Lavagne:</strong> Nessuna azione.
          </li>
          <li>
            <strong>Gestione Prodotti (Su qualsiasi lavagna):</strong> PUÒ
            aggiungere, modificare nomi (long press), eliminare,
            segnare/deselezionare prodotti.
          </li>
          <li>
            <strong>Personalizzazione:</strong> PUÒ cambiare il proprio sfondo
            personale per qualsiasi lavagna.
          </li>
        </ul>
      </div>
      <hr className="legend-hr" />
      {/* Sezione Contributor */}
      <div className="role-section">
        <strong className="role-title role-contributor">
          ✍️ Contributor (Level 2)
        </strong>
        <p className="role-description">
          Il contributor può aggiungere contenuti alle lavagne (non di default)
          e interagire con gli elementi esistenti.
        </p>
        <ul className="role-permissions">
          <li>
            <strong>Gestione Gruppo:</strong> Nessuna azione.
          </li>
          <li>
            <strong>Gestione Lavagne:</strong> Nessuna azione.
          </li>
          <li>
            <strong>Gestione Prodotti:</strong>
            <ul className="sub-permissions">
              {" "}
              {/* Classe per sotto-lista */}
              <li>
                PUÒ aggiungere nuovi prodotti (SOLO su lavagne NON di default).
              </li>
              <li>NON PUÒ aggiungere prodotti sulla lavagna di default.</li>
              <li>NON PUÒ modificare il nome dei prodotti.</li>
              <li>NON PUÒ eliminare prodotti.</li>
              <li>
                PUÒ segnare/deselezionare prodotti (SU QUALSIASI lavagna).
              </li>
            </ul>
          </li>
          <li>
            <strong>Personalizzazione:</strong> PUÒ cambiare il proprio sfondo
            personale per qualsiasi lavagna.
          </li>
        </ul>
      </div>
      <hr className="legend-hr" />
      <p className="legend-note">
        {" "}
        {/* Classe specifica per nota */}
        <em>
          Nota: La "Lavagna di Default" del gruppo non può essere rinominata o
          eliminata.
        </em>
      </p>
    </div>
  );
};

export default PermissionLegend;
