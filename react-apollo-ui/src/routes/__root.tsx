import { createRootRoute, Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('app-theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('app-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="border-b border-gray-800 dark:border-gray-700 px-6 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5 group">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
            <polygon points="16,3 27.3,22.5 4.7,22.5" fill="none" stroke="#E10098" strokeWidth="1.5" strokeLinejoin="round"/>
            <polygon points="27.3,9.5 16,29 4.7,9.5" fill="none" stroke="#E10098" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="16"   cy="3"    r="2" fill="#E10098"/>
            <circle cx="27.3" cy="9.5"  r="2" fill="#E10098"/>
            <circle cx="27.3" cy="22.5" r="2" fill="#E10098"/>
            <circle cx="16"   cy="29"   r="2" fill="#E10098"/>
            <circle cx="4.7"  cy="22.5" r="2" fill="#E10098"/>
            <circle cx="4.7"  cy="9.5"  r="2" fill="#E10098"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)' }} className="text-base font-medium tracking-tight">
            Application Tracker
          </span>
        </Link>
        <div className="flex gap-3 items-center">
          <button
            type="button"
            onClick={() => navigate({ to: '/applications/new' })}
            className="text-white px-4 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'var(--gql-pink)' }}
          >
            Add Application
          </button>
          <button
            onClick={() => setDark(d => !d)}
            aria-label={dark ? 'switch to light mode' : 'switch to dark mode'}
            className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
