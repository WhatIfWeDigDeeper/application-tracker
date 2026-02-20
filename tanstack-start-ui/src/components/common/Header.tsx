import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "../ui";

export function Header() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Sync state from DOM/localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem("app-theme");
    const shouldBeDark =
      stored === "dark" ||
      (!stored &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(shouldBeDark);
    // The inline script in __root.tsx already applied the class;
    // ensure it's consistent
    document.documentElement.classList.toggle("dark", shouldBeDark);
    setHydrated(true);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const newDark = !prev;
      document.documentElement.classList.toggle("dark", newDark);
      localStorage.setItem("app-theme", newDark ? "dark" : "light");
      return newDark;
    });
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <svg
              className="w-8 h-8 flex-shrink-0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Python-inspired logo: two intertwined snakes */}
              <path
                d="M11.5 2C9 2 7 3.5 7 5.5V9h4.5v1H5.5C3.5 10 2 12 2 14.5s1.5 4.5 3.5 4.5H7v-2.5c0-2 2-3.5 4.5-3.5H16c1.9 0 3-1.3 3-3V5.5C19 3.5 17 2 14.5 2H11.5zm-1 2.25a1 1 0 110 2 1 1 0 010-2z"
                fill="#4584b6"
              />
              <path
                d="M12.5 22c2.5 0 4.5-1.5 4.5-3.5V15h-4.5v-1h6c2 0 3.5-2 3.5-4.5S20.5 5 18.5 5H17v2.5c0 2-2 3.5-4.5 3.5H8c-1.9 0-3 1.3-3 3v3.5C5 20.5 7 22 9.5 22h3zm1-2.25a1 1 0 110-2 1 1 0 010 2z"
                fill="#ffde57"
              />
            </svg>
            <h1
              className="text-xl font-bold text-gray-900 dark:text-white truncate"
              style={hydrated ? undefined : { visibility: "hidden" }}
            >
              Job Application Tracker{" "}
              <span className="hidden sm:inline text-sm font-normal text-gray-500 dark:text-gray-400">
                (React SSR - FastAPI - asyncpg)
              </span>
            </h1>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleDark}
              disabled={!hydrated}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Add Application Button */}
            <Button onClick={() => navigate({ to: "/applications/new" })}>
              <svg
                className="w-4 h-4 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add Application</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
