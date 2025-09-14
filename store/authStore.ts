import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

interface AuthState {
  // Onboarding state
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (value: boolean) => void;
  
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  
  // Location state
  userLocation: string;
  setUserLocation: (location: string) => void;
  hasSelectedLocation: boolean; // Add this flag
  setHasSelectedLocation: (value: boolean) => void; // Add this setter
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      hasSeenOnboarding: false,
      user: null,
      isAuthenticated: false,
      userLocation: "Nagpur, Maharashtra", // Default location
      hasSelectedLocation: false, // Initial value
      
      // Actions
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      
      setUserLocation: (location) => set({ userLocation: location }),
      
      setHasSelectedLocation: (value) => set({ hasSelectedLocation: value }),
      
      login: (user) => set({ 
        user, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);