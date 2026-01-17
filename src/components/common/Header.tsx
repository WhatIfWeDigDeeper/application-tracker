import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function Header({
  title = 'Job Application Tracker',
  children,
  className,
}: HeaderProps): ReactNode {
  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200 sticky top-0 z-40',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          {children && (
            <div className="flex items-center gap-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
