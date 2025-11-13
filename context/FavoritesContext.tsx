// contexts/FavoritesContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import { useFocusEffect } from '@react-navigation/native'; // Add for screen focus trigger

// JWT decode helper (manual base64, no lib needed)
const decodeJWT = (token: string): { id?: string } => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    let payloadB64 = parts[1];
    // Add padding if needed
    const padding = (4 - (payloadB64.length % 4)) % 4;
    payloadB64 += '='.repeat(padding);
    const payload = JSON.parse(atob(payloadB64));
    return { id: payload.id };
  } catch {
    return {};
  }
};

// Helper to get token from storage (same as Dashboard)
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("token");
  } catch (error) {
    console.error("Error fetching auth token in FavoritesContext:", error);
    return null;
  }
};

// Fetch user favorites from backend (adjust endpoints and mapping as per your API response)
const fetchUserFavoritesFromBackend = async (userId: string, type: 'tiffin' | 'hostel' = 'tiffin'): Promise<FavoriteItem[]> => {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const url = type === 'tiffin' 
      ? `https://tifstay-project-be.onrender.com/api/guest/tiffinServices/getFavouriteTiffinServices` 
      : `https://tifstay-project-be.onrender.com/api/guest/hostelServices/getFavouriteHostelServices`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (result.success && result.data && Array.isArray(result.data)) {
      // Map backend data to FavoriteItem (adjust based on your response shape, e.g., data is array of services)
      return result.data.map((fav: any) => ({
        id: fav._id || fav.tiffinServiceId || fav.hostelServiceId, // Adjust key to match your API
        type,
        data: fav, // Full item data from backend
      }));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching ${type} favorites:`, error);
    return [];
  }
};

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
  clearFavorites: () => void; // For explicit logout clear
  refreshFavorites: () => void; // Manual refresh for login/user switch
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
  const { user, profileData, fetchProfile } = useAuthStore();
  const prevUserIdRef = React.useRef<string | null>(null);

  // Update effectiveUserId (async for token fetch)
  const updateUserId = useCallback(async () => {
    let id: string | null = null;

    // Priority: profileData.id > user.id > token decode from storage
    if (profileData?.id) {
      id = profileData.id;
    } else if (user?.id) {
      id = user.id;
    } else {
      const token = await getAuthToken();
      if (token) {
        const decoded = decodeJWT(token);
        id = decoded.id || null;
        console.log(`🔄 [Favorites] Token decoded ID: ${id || 'failed'}`);
      }
    }

    const idSource = profileData?.id ? 'profileData' : user?.id ? 'user' : id ? 'token' : 'none';
    console.log(`🔄 [Favorites] Computed Effective User ID: ${id} (source: ${idSource})`);

    // Use ref to compare without adding to deps (avoids infinite loop)
    if (id !== prevUserIdRef.current) {
      prevUserIdRef.current = id;
      setEffectiveUserId(id);
      // If we have ID from token but no profile, fetch it to populate store
      if (id && !profileData?.id) {
        console.log(`🔄 [Favorites] Triggering fetchProfile for ID: ${id}`);
        fetchProfile().catch((err) => console.error("fetchProfile error:", err));
      }
    }
  }, [profileData?.id, user?.id, fetchProfile]);

  // Run update on mount and auth changes
  useEffect(() => {
    updateUserId();
  }, [updateUserId]);

  // FIXED: Add short interval to re-check ID every 5s (catches async token updates from login)
  useEffect(() => {
    const interval = setInterval(updateUserId, 5000); // 5s check for token/user changes
    return () => clearInterval(interval);
  }, [updateUserId]);

  // Load favorites when effectiveUserId changes (with backend sync)
  useEffect(() => {
    const loadFavorites = async (userId: string | null) => {
      console.log(`🔍 [Favorites] Loading for userId: ${userId}`);
      if (!userId) {
        console.log(`🔍 [Favorites] Clearing favorites (no userId)`);
        setFavorites([]);
        return;
      }
      try {
        // First, try local storage
        let parsed = [];
        const storedKey = `favorites_${userId}`;
        const storedFavorites = await AsyncStorage.getItem(storedKey);
        if (storedFavorites) {
          parsed = JSON.parse(storedFavorites);
          console.log(`🔍 [Favorites] Loaded ${parsed.length} from local storage`);
        }

        // Sync with backend (fetch and merge/add if backend has more)
        const backendTiffins = await fetchUserFavoritesFromBackend(userId, 'tiffin');
        const backendHostels = await fetchUserFavoritesFromBackend(userId, 'hostel');
        const backendAll = [...backendTiffins, ...backendHostels];

        // Merge: Keep local, add backend-only (avoid dups by ID+type)
        const merged = [
          ...parsed,
          ...backendAll.filter(b => !parsed.some(l => l.id === b.id && l.type === b.type))
        ];
        console.log(`🔍 [Favorites] Merged: local=${parsed.length}, backend=${backendAll.length}, total=${merged.length}`);

        setFavorites(merged);
        // Overwrite storage with merged for future consistency
        await AsyncStorage.setItem(storedKey, JSON.stringify(merged));
      } catch (error) {
        console.error("Error loading/merging favorites:", error);
        setFavorites([]);
      }
    };

    loadFavorites(effectiveUserId);
  }, [effectiveUserId]);

  // FIXED: Periodic token check for logout detection (runs every 30s, clears if token gone)
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = await getAuthToken();
      if (!token && effectiveUserId) {
        console.log(`🚫 [Favorites] Token missing - forcing logout clear`);
        await clearFavorites();
      }
    }, 30000); // 30s interval

    return () => clearInterval(interval);
  }, [effectiveUserId]);

  const saveFavorites = useCallback(async (newFavorites: FavoriteItem[]) => {
    console.log(`💾 [Favorites] Saving ${newFavorites.length} items for effectiveUserId: ${effectiveUserId}`);
    if (!effectiveUserId) {
      console.warn(`💾 [Favorites] Skipping save (no effectiveUserId)`);
      return;
    }
    try {
      await AsyncStorage.setItem(`favorites_${effectiveUserId}`, JSON.stringify(newFavorites));
      console.log(`💾 [Favorites] Successfully saved to key 'favorites_${effectiveUserId}'`);
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  }, [effectiveUserId]);

  const addToFavorites = useCallback((item: FavoriteItem) => {
    const newFavorites = [...favorites, item];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  const removeFromFavorites = useCallback((id: string | number, type: "tiffin" | "hostel") => {
    const newFavorites = favorites.filter((item) => !(item.id === id && item.type === type));
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  const isFavorite = useCallback((id: string | number, type: "tiffin" | "hostel") => {
    return favorites.some((item) => item.id === id && item.type === type);
  }, [favorites]);

  const toggleFavorite = useCallback((item: any, type: "tiffin" | "hostel") => {
    if (isFavorite(item.id, type)) {
      removeFromFavorites(item.id, type);
    } else {
      addToFavorites({ id: item.id, type, data: item });
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // Explicit clear for logout (call from authStore logout action)
  const clearFavorites = useCallback(async () => {
    console.log(`🧹 [Favorites] Explicit clear on logout`);
    setFavorites([]);
    if (effectiveUserId) {
      await AsyncStorage.removeItem(`favorites_${effectiveUserId}`);
    }
    const token = await getAuthToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded.id) {
        await AsyncStorage.removeItem(`favorites_${decoded.id}`);
      }
    }
    setEffectiveUserId(null);
    prevUserIdRef.current = null;
  }, [effectiveUserId]);

  // ADDED: Manual refresh (call after login to force ID/load update)
  const refreshFavorites = useCallback(async () => {
    console.log(`🔄 [Favorites] Manual refresh triggered`);
    await updateUserId();
    // Force re-load after ID update
    if (effectiveUserId) {
      const loadFavorites = async (userId: string) => {
        try {
          const storedKey = `favorites_${userId}`;
          const storedFavorites = await AsyncStorage.getItem(storedKey);
          const parsed = storedFavorites ? JSON.parse(storedFavorites) : [];
          const backendTiffins = await fetchUserFavoritesFromBackend(userId, 'tiffin');
          const backendHostels = await fetchUserFavoritesFromBackend(userId, 'hostel');
          const backendAll = [...backendTiffins, ...backendHostels];
          const merged = [...parsed, ...backendAll.filter(b => !parsed.some(l => l.id === b.id && l.type === b.type))];
          setFavorites(merged);
          await AsyncStorage.setItem(storedKey, JSON.stringify(merged));
          console.log(`🔄 [Favorites] Refreshed: total=${merged.length}`);
        } catch (error) {
          console.error("Error in refreshFavorites:", error);
        }
      };
      await loadFavorites(effectiveUserId);
    }
  }, [effectiveUserId, updateUserId]);

  // FIXED: Use useFocusEffect to re-check on screen focus (helps with navigation after login)
  useFocusEffect(
    React.useCallback(() => {
      updateUserId();
    }, [updateUserId])
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
        clearFavorites,
        refreshFavorites,
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