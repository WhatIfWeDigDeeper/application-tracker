import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useUiStore.setState({
      sidebarCollapsed: false,
      panelOpen: false,
      panelTab: 'details',
      darkMode: false,
      viewMode: 'grid',
    });
  });

  it('toggles dark mode and persists preference', () => {
    useUiStore.getState().toggleDarkMode();

    expect(useUiStore.getState().darkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('app-theme')).toBe('dark');

    useUiStore.getState().toggleDarkMode();

    expect(useUiStore.getState().darkMode).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('app-theme')).toBe('light');
  });

  it('persists view mode and updates panel state', () => {
    useUiStore.getState().setViewMode('list');
    useUiStore.getState().openPanel('history');

    expect(localStorage.getItem('app-view-mode')).toBe('list');
    expect(useUiStore.getState().viewMode).toBe('list');
    expect(useUiStore.getState().panelOpen).toBe(true);
    expect(useUiStore.getState().panelTab).toBe('history');

    useUiStore.getState().closePanel();
    expect(useUiStore.getState().panelOpen).toBe(false);
  });
});
