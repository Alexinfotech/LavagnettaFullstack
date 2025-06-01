//frontend/src/components/GroupDashboard/Boards/GroupBoardsList.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useGroup } from "../../../contexts/GroupContext";
import "./GroupBoardsList.css";

const GroupBoardsList = () => {
  const { currentGroup, boards, currentUserRole } = useGroup();
  const navigate = useNavigate();

  const isAdmin = currentUserRole === "admin";

  const handleBoardSelect = (boardId) => {
    // Naviga alla pagina della board di gruppo
    navigate(`/groups/${currentGroup.id}/boards/${boardId}`);
  };

  // Opzionale: Pulsante per aggiungere lavagnetta se admin
  const handleAddBoard = () => {
    if (!isAdmin) return;
    // Logica per aggiungere una nuova lavagnetta di gruppo...
    // Potrebbe aprire un modal simile a CreateGroupModal
    // Non implementata qui per brevità
    alert("Funzione: Aggiungi Lavagnetta (solo admin)");
  };

  return (
    <div className="group-boards-list">
      <h3>Lavagnette del Gruppo</h3>
      {isAdmin && <button onClick={handleAddBoard}>Aggiungi Lavagnetta</button>}
      <ul>
        {boards.map((board) => (
          <li key={board.id} onClick={() => handleBoardSelect(board.id)}>
            {board.name} {board.is_group_default ? "(Default)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupBoardsList;
