import React, { createContext, useContext, useState } from "react";

interface AppStateContextType {
  serviceType: number;
  setServiceType: (type: number) => void;
  user: any;
  setUser: (user: any) => void;
  // Filter state
  isFilterApplied: boolean;
  setIsFilterApplied: (value: boolean) => void;
  appliedFilters: any;
  setAppliedFilters: (filters: any) => void;
  // Search focus state
  isSearchFocused: boolean;
  setIsSearchFocused: (value: boolean) => void;
}

export const AppStateContext = createContext<AppStateContextType | null>(null);

export const AppStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [serviceType, setServiceType] = useState(0);
  const [user, setUser] = useState(null);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <AppStateContext.Provider
      value={{
        serviceType,
        setServiceType,
        user,
        setUser,
        isFilterApplied,
        setIsFilterApplied,
        appliedFilters,
        setAppliedFilters,
        isSearchFocused,
        setIsSearchFocused,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};
