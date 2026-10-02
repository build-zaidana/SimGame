import { create } from 'zustand';

export type Screen =
  'title' | 'hub' | 'desk' | 'report' | 'review' | 'rulebook' | 'settings' | 'save-transfer';

interface AppState {
  screen: Screen;
  goTo(screen: Screen): void;
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'title',
  goTo: (screen) => set({ screen }),
}));
