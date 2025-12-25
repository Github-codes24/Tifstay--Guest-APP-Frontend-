import React, { createContext, useContext, useState } from "react";
import { useAuthStore } from "@/store/authStore";

interface AppStateContextType {
  serviceType: number;
  setServiceType: (type: number) => void;
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
  childrendsdsa React.ReactNode;
}) => {
  const [serviceType, setServiceType] = useState(0);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <AppStateContext.Provider
      value={{
        serviceType,
        setServiceType,
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
