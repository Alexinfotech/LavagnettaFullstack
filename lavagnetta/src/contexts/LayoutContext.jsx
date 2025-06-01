// src/contexts/LayoutContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

export const LayoutProvider = ({ children }) => {
  const [isSubHeaderHidden, setIsSubHeaderHidden] = useState(false);

  // Funzione per nascondere il sub-header
  const hideSubHeader = useCallback(() => {
    // console.log("LayoutContext: Hiding SubHeader");
    setIsSubHeaderHidden(true);
  }, []);

  // Funzione per mostrare il sub-header
  const showSubHeader = useCallback(() => {
    // console.log("LayoutContext: Showing SubHeader");
    setIsSubHeaderHidden(false);
  }, []);

  const value = {
    isSubHeaderHidden,
    hideSubHeader,
    showSubHeader,
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};
//funxzioannte
