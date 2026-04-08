import { create } from 'zustand';

type PanelTab = 'details' | 'interview' | 'history';
type ViewMode = 'grid' | 'list';

interface UiState {
  sidebarCollapsed: boolean;
  panelOpen: boolean;
  panelTab: PanelTab;
  darkMode: boolean;
  viewMode: ViewMode;
  toggleSidebar: () => void;
  openPanel: (tab?: PanelTab) => void;
  closePanel: () => void;
  setPanelTab: (tab: PanelTab) => void;
  toggleDarkMode: () => void;
  setViewMode: (mode: ViewMode) => void;
}

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem('app-theme') === 'dark';
}

function getInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') {
    return 'grid';
  }
  const saved = localStorage.getItem('app-view-mode');
  return saved === 'list' ? 'list' : 'grid';
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  panelOpen: false,
  panelTab: 'details',
  darkMode: getInitialTheme(),
  viewMode: getInitialViewMode(),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openPanel: (tab = 'details') => set({ panelOpen: true, panelTab: tab }),
  closePanel: () => set({ panelOpen: false }),
  setPanelTab: (tab) => set({ panelTab: tab }),
  toggleDarkMode: () =>
    set((state) => {
      const darkMode = !state.darkMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('app-theme', darkMode ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', darkMode);
      }
      return { darkMode };
    }),
  setViewMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-view-mode', mode);
    }
    set({ viewMode: mode });
  },
}));
