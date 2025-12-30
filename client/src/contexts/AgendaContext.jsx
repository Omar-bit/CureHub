import React, { createContext, useState, useContext } from 'react';

const AgendaContext = createContext();

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
};

export const AgendaProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [incompleteTaskCount, setIncompleteTaskCount] = useState(0);

  const updateIncompleteTaskCount = (count) => {
    setIncompleteTaskCount(count);
  };

  const value = {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    incompleteTaskCount,
    updateIncompleteTaskCount,
  };

  return (
    <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>
  );
};
