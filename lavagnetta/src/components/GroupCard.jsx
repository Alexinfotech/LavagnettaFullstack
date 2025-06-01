// frontend/src/components/GroupDashboard/GroupCard.jsx

import React from "react";
import "./GroupCard.css";
import { FaUsers, FaChalkboard } from "react-icons/fa";

const GroupCard = ({ group, onSelect }) => {
  return (
    <div className="group-card" onClick={onSelect}>
      <h3>{group.name}</h3>
      <div className="group-stats">
        <div className="stat">
          <FaUsers />
          <span>{group.memberCount || 0} membri</span>
        </div>
        <div className="stat">
          <FaChalkboard />
          <span>{group.boardCount || 0} lavagne</span>
        </div>
      </div>
      <div className="group-role">Il tuo ruolo: {group.role}</div>
    </div>
  );
};

export default GroupCard;
