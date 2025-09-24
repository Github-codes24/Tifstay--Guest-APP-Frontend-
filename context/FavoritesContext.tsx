// contexts/FavoritesContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FavoriteItem {
  id: string | number;
  type: "tiffin" | "hostel";
  data: any;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (id: string | number, type: "tiffin" | "hostel") => void;
  isFavorite: (id: string | number, type: "tiffin" | "hostel") => boolean;
  toggleFavorite: (item: any, type: "tiffin" | "hostel") => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem("favorites");
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const saveFavorites = async (newFavorites: FavoriteItem[]) => {
    try {
      await AsyncStorage.setItem("favorites", JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const addToFavorites = (item: FavoriteItem) => {
    const newFavorites = [...favorites, item];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const removeFromFavorites = (
    id: string | number,
    type: "tiffin" | "hostel"
  ) => {
    const newFavorites = favorites.filter(
      (item) => !(item.id === id && item.type === type)
    );
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const isFavorite = (id: string | number, type: "tiffin" | "hostel") => {
    return favorites.some((item) => item.id === id && item.type === type);
  };

  const toggleFavorite = (item: any, type: "tiffin" | "hostel") => {
    if (isFavorite(item.id, type)) {
      removeFromFavorites(item.id, type);
    } else {
      addToFavorites({
        id: item.id,
        type,
        data: item,
      });
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
