import { create } from 'zustand';
import { Settings, defaultSettings } from '../lib/types';

interface SettingsStore extends Settings {
  setApiUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setDownloadPath: (path: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaultSettings,

  setApiUrl: (url) => set({ apiUrl: url }),
  setApiKey: (key) => set({ apiKey: key }),
  setDownloadPath: (path) => set({ downloadPath: path }),
  setTheme: (theme) => set({ theme }),

  saveSettings: async () => {
    const { apiUrl, apiKey, downloadPath, theme } = get();
    const settings = { apiUrl, apiKey, downloadPath, theme };

    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('settings.json');
      await store.set('settings', settings);
      await store.save();
    } catch (e) {
      // Fallback to localStorage if Tauri store fails
      localStorage.setItem('sfs-settings', JSON.stringify(settings));
    }
  },

  loadSettings: async () => {
    let settings: Settings | null = null;

    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      const store = await Store.load('settings.json');
      const loaded = await store.get<Settings>('settings');
      settings = loaded ?? null;
    } catch (e) {
      // Fallback to localStorage
      const stored = localStorage.getItem('sfs-settings');
      if (stored) {
        settings = JSON.parse(stored);
      }
    }

    if (settings) {
      set(settings);
    }
  },
}));
