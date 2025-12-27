import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "@/constants/api";

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

interface ProfileData {
  profileImage?: string;
  name?: string;
  email?: string;
  // Add more fields as per your backend response
}

interface AuthState {
  // Onboarding
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;

  // Location
  userLocation: string;           // Full address (subtext)
  locationLabel: string;          // "Home", "Work", "Current Location" etc.
  locationIcon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap; // Icon name
  hasSelectedLocation: boolean;

  setUserLocation: (location: string) => void;
  setLocationLabel: (label: string) => void;
  setLocationIcon: (icon: AuthState["locationIcon"]) => void;
  setHasSelectedLocation: (value: boolean) => void;

  // Profile
  profileData: ProfileData | null;
  fetchProfile: () => Promise<void>;

  // Hydration
  rehydrated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial values
      hasSeenOnboarding: false,
      user: null,
      isAuthenticated: false,

      userLocation: "No Location Saved",
      locationLabel: "Home Location",   // Default top label
      locationIcon: "home",             // Default icon
      hasSelectedLocation: false,

      profileData: null,
      rehydrated: false,

      // Actions
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),

      setUserLocation: (location) => set({ userLocation: location }),
      setLocationLabel: (label) => set({ locationLabel: label }),
      setLocationIcon: (icon) => set({ locationIcon: icon }),
      setHasSelectedLocation: (value) => set({ hasSelectedLocation: value }),

      fetchProfile: async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            console.warn("No token found for profile fetch");
            return;
          }

          const response = await axios.get(`${BASE_URL}/api/guest/getProfile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.success && response.data.data?.guest) {
            const profile = response.data.data.guest;
            set({ profileData: profile });

            // Sync name to user state if available
            if (profile.name && get().user) {
              set((state) => ({
                user: state.user ? { ...state.user, name: profile.name } : null,
              }));
            }

            console.log("Profile fetched:", profile);
          }
        } catch (error: any) {
          console.error(
            "Profile fetch failed:",
            error.response?.data || error.message
          );
          set({ profileData: null });
        }
      },

      login: (user) => {
        set({
          user,
          isAuthenticated: true,
          hasSelectedLocation: false, // Reset location on new login if needed
        });
        // Auto-fetch profile after login
        get().fetchProfile();
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          profileData: null,
          userLocation: "No Location Saved",
          locationLabel: "Home Location",
          locationIcon: "home",
          hasSelectedLocation: false,
        });
        // Optional: Clear AsyncStorage token here if needed
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // This runs after rehydration completes
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
        }
      },
    }
  )
);