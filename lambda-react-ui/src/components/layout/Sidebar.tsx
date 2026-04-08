import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useFilterStore } from '@/stores/filterStore';
import { useUiStore } from '@/stores/uiStore';

export function Sidebar() {
  const navigate = useNavigate();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const toggleDarkMode = useUiStore((state) => state.toggleDarkMode);
  const darkMode = useUiStore((state) => state.darkMode);

  const setIncludeArchived = useFilterStore((state) => state.setIncludeArchived);
  const setStatusFilter = useFilterStore((state) => state.setStatusFilter);

  return (
    <>
      <aside
        data-testid="sidebar"
        style={{
          background: 'var(--bg-sidebar)',
          color: 'var(--text-on-dark)',
          padding: '1rem',
          width: sidebarCollapsed ? '56px' : '240px',
        }}
        className="hidden md:block"
      >
        <div className="flex items-center justify-between gap-2">
          {!sidebarCollapsed ? <strong>AppTracker</strong> : <strong>A</strong>}
          <Button variant="ghost" size="sm" onClick={toggleSidebar} type="button" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {sidebarCollapsed ? '>' : '<'}
          </Button>
        </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-on-dark-dim)' }}>
        {!sidebarCollapsed ? 'Track your job pipeline' : null}
      </div>

      <nav className="mt-4 flex flex-col gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            navigate('/');
            setIncludeArchived(false);
            setStatusFilter([]);
          }}
          type="button"
        >
          {sidebarCollapsed ? 'P' : 'Pipeline'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            navigate('/');
            setIncludeArchived(false);
          }}
          type="button"
        >
          {sidebarCollapsed ? 'A' : 'All'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            navigate('/');
            setIncludeArchived(true);
          }}
          type="button"
        >
          {sidebarCollapsed ? 'S' : 'Stored'}
        </Button>
      </nav>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleDarkMode}
            type="button"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            Theme
          </Button>
        </div>
      </aside>

      <nav data-testid="bottom-nav" className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 gap-1 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            navigate('/');
            setIncludeArchived(false);
            setStatusFilter([]);
          }}
        >
          Pipeline
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            navigate('/');
            setIncludeArchived(false);
          }}
        >
          All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            navigate('/');
            setIncludeArchived(true);
          }}
        >
          Stored
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          Theme
        </Button>
      </nav>
    </>
  );
}
