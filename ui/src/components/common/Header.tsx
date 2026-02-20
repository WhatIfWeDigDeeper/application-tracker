'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  showThemeToggle?: boolean;
}

export function Header({
  title = 'Job Application Tracker',
  subtitle = '(React - Express - Prisma)',
  children,
  className,
  showThemeToggle = true,
}: HeaderProps): ReactNode {
  return (
    <header
      className={cn(
        'bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 transition-colors duration-300',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 min-w-0">
            <svg
              className="w-8 h-8 flex-shrink-0"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="16" cy="16" r="15" fill="#000" />
              <path d="M11 8v16l10-16v16" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-50 truncate">
              {title}{' '}
              {subtitle && (
                <span className="hidden sm:inline text-sm font-normal text-gray-500 dark:text-slate-400">
                  {subtitle}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {showThemeToggle && <ThemeToggle />}
            {children && children}
          </div>
        </div>
      </div>
    </header>
  );
}
