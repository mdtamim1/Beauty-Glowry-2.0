import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  skin_type?: string;
  created_at: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  updateSkinProfile: (skinType: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => {
        set({ user: null, token: null });
        fetch('/api/auth/logout', { method: 'POST' }).catch((err) =>
          console.error('Logout error:', err)
        );
      },
      updateSkinProfile: (skinType) => {
        const u = get().user;
        if (u) {
          set({ user: { ...u, skin_type: skinType } });
        }
      },
    }),
    {
      name: 'beautyglowry-auth-storage',
    }
  )
);
