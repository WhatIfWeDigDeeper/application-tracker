'use client';

import type { ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

export interface UrlFieldInputProps {
  label?: string;
  name: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function UrlFieldInput({
  label,
  name,
  value,
  placeholder,
  error,
  onChange,
}: UrlFieldInputProps): React.ReactElement {
  const isValidUrl = value.startsWith('http://') || value.startsWith('https://');

  const handleOpenUrl = (): void => {
    if (isValidUrl) {
      window.open(value, '_blank');
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="url"
          id={name}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={cn(
            'block w-full rounded-md shadow-sm',
            'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            'dark:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400',
            'placeholder:text-gray-400 dark:placeholder:text-slate-500',
            'px-3 py-2 text-base text-gray-900 bg-white',
            'dark:text-slate-100 dark:bg-slate-800',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          )}
          aria-invalid={error ? 'true' : 'false'}
        />
        {isValidUrl && (
          <button
            type="button"
            onClick={handleOpenUrl}
            className="p-2 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Open URL in new tab"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
