export type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  apiUrl: string;
  apiKey: string;
  downloadPath: string;
  theme: Theme;
  searchLimit: number;
  searchScoreThreshold: number;
}

export const defaultSettings: Settings = {
  apiUrl: 'https://localhost',
  apiKey: '',
  downloadPath: '',
  theme: 'system',
  searchLimit: 5,
  searchScoreThreshold: 0.5,
};
