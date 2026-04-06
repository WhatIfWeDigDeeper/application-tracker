import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { ContextPanel } from '@/components/layout/ContextPanel';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUiStore } from '@/stores/uiStore';

function App() {
  const panelOpen = useUiStore((state) => state.panelOpen);

  return (
    <div
      className="grid min-h-screen grid-cols-1 overflow-x-hidden bg-[var(--bg-page)] md:[grid-template-columns:auto_1fr] xl:[grid-template-columns:auto_1fr_var(--panel-width)]"
      style={{
        ['--panel-width' as string]: panelOpen ? '380px' : '0px',
      } as CSSProperties}
    >
      <Sidebar />
      <main style={{ padding: '1rem', overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </main>
      <ContextPanel />
    </div>
  );
}

export default App;
