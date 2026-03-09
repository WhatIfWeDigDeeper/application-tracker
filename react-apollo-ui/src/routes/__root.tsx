import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <nav className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Application Tracker</Link>
        <div className="flex gap-4 items-center">
          <Link to="/applications/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium">
            Add Application
          </Link>
          <button onClick={() => setDark(d => !d)}
            className="p-2 rounded border border-gray-300 dark:border-gray-600 text-sm">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
