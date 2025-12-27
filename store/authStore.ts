import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";  // <-- Add this import for API calls

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

interface ProfileData {  // <-- Optional: Define interface for profile if structure known
  profileImage?: string;
  name?: string;
  // Add other fields from API response as needed
}

interface AuthState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;

  user: User | null;
  isAuthenticated: boolean;

  userLocation: string;
  setUserLocation: (location: string) => void;
  hasSelectedLocation: boolean;
  setHasSeenOnboarding: (value: boolean) => void;

  profileData: ProfileData | null;  // <-- Add this: Profile data from API
  fetchProfile: () => Promise<void>;  // <-- Add this action

  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;

  rehydrated: boolean; // ✅ Keep this flag
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({  // <-- Add 'get' param for actions if needed
      hasSeenOnboarding: false,
      user: null,
      isAuthenticated: false,
      userLocation: "No Location Saved",
      hasSelectedLocation: false,
      profileData: null,  // <-- Initialize null
      rehydrated: false, // ✅ initialize false

      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setUserLocation: (location) => set({ userLocation: location }),
      setHasSelectedLocation: (value) => set({ hasSelectedLocation: value }),

      fetchProfile: async () => {  // <-- Implement async action
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            console.warn("No token found for profile fetch");
            return;
          }

          const response = await axios.get(
            "https://tifstay-project-be.onrender.com/api/guest/getProfile",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const profile = response.data.data.guest;  // Assuming API structure
          set({ profileData: profile });

          // Optional: Merge profile name into user if not set
          if (profile.name && get().user) {
            set((state) => ({
              user: { ...state.user, name: profile.name },
            }));
          }

          console.log("Profile fetched successfully:", profile);
        } catch (error: any) {
          console.error("Profile fetch error:", error.response?.data || error.message);
          set({ profileData: null });  // Reset on error
        }
      },

      login: (user) => {
        set({ user, isAuthenticated: true });
        // Optional: Fetch profile immediately after login
        get().fetchProfile();
      },
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          profileData: null,  // <-- Clear profile on logout
        });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // ✅ Mark store as rehydrated after persistence loads
        if (state) state.rehydrated = true;
      },
    }
  )
);