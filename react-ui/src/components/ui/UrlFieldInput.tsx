import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface UrlFieldInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const UrlFieldInput = forwardRef<HTMLInputElement, UrlFieldInputProps>(
  ({ className, label, error, id, value, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const stringValue = typeof value === "string" ? value : "";
    const isValidUrl =
      stringValue.startsWith("http://") || stringValue.startsWith("https://");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="url"
            id={inputId}
            value={value}
            className={cn(
              "flex-1 w-full px-3 py-2 border rounded-lg shadow-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 dark:border-gray-600",
              className
            )}
            {...props}
          />
          {isValidUrl && (
            <a
              href={stringValue}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            </a>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

UrlFieldInput.displayName = "UrlFieldInput";
