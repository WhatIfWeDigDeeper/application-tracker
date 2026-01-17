'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export interface HeaderProps {
  title?: string;
  children?: ReactNode;
  className?: string;
  showThemeToggle?: boolean;
}

export function Header({
  title = 'Job Application Tracker',
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
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-50">
              {title}
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
