// frontend/src/components/GroupDashboard/GroupList/GroupList.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const GroupList = ({ groups }) => {
  const navigate = useNavigate();

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <div>
      {groups.map((group) => (
        <div key={group.id} onClick={() => handleGroupClick(group.id)}>
          {group.name}
        </div>
      ))}
    </div>
  );
};

export default GroupList;
