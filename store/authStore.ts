import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

interface AuthState {
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;

  user: User | null;
  isAuthenticated: boolean;

  userLocation: string;
  setUserLocation: (location: string) => void;
  hasSelectedLocation: boolean;
  setHasSelectedLocation: (value: boolean) => void;

  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      user: null,
      isAuthenticated: false,
      userLocation: "Nagpur, Maharashtra",
      hasSelectedLocation: false,

      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),

      setUserLocation: (location) => set({ userLocation: location }),

      setHasSelectedLocation: (value) => set({ hasSelectedLocation: value }),

      login: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);