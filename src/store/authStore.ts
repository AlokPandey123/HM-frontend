import { create } from 'zustand';

interface Permission { module: string; actions: string[]; }

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager';
  permissions: Permission[];
  hospitalCity?: { _id: string; name: string };
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasPermission: (module: string, action: string) => boolean;
}

const stored = localStorage.getItem('sunriseivf_token');
const storedUser = localStorage.getItem('sunriseivf_user');

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: stored,

  login: (user, token) => {
    localStorage.setItem('sunriseivf_token', token);
    localStorage.setItem('sunriseivf_user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('sunriseivf_token');
    localStorage.removeItem('sunriseivf_user');
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!get().token && !!get().user,

  hasPermission: (module, action) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    const perm = user.permissions?.find((p) => p.module === module);
    return perm?.actions.includes(action) ?? false;
  },
}));
