import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  toggleTheme: () => {
    const { isDark } = get();
    set({ isDark: !isDark });
    document.documentElement.classList.toggle('dark', !isDark);
  },
}));