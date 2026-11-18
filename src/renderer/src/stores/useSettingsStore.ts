import { create } from 'zustand';
import { AppSettings } from '../../../../common/types';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  testStatus: {
    tested: boolean;
    valid: boolean;
    message?: string;
  };
  setSettings: (settings: AppSettings) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setTestStatus: (status: { tested: boolean; valid: boolean; message?: string }) => void;
}

const defaultSettings: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  browserType: 'chromium',
  headless: false,
  viewportWidth: 1280,
  viewportHeight: 800,
  actionTimeoutMs: 15000,
  slowMoMs: 500,
  maxRetries: 2,
  requireConfirmationForSensitive: true,
  saveScreenshotsOnFailure: true,
  theme: 'dark',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoading: false,
  isSaving: false,
  testStatus: {
    tested: false,
    valid: false,
  },
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setTestStatus: (testStatus) => set({ testStatus }),
}));
