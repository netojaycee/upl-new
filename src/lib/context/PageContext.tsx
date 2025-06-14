import React, { createContext, useContext, useState, ReactNode } from "react";

interface PageContextData {
  leagueName?: string;
  teamName?: string;
  playerName?: string;
  matchTitle?: string;
  newsTitle?: string;
}

interface PageContextType {
  data: PageContextData;
  setData: (data: Partial<PageContextData>) => void;
  clearData: () => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const PageContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setDataState] = useState<PageContextData>({});

  const setData = (newData: Partial<PageContextData>) => {
    setDataState((prev) => ({ ...prev, ...newData }));
  };

  const clearData = () => {
    setDataState({});
  };

  return (
    <PageContext.Provider value={{ data, setData, clearData }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within a PageContextProvider");
  }
  return context;
};
