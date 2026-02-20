import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            "w-4 h-4 text-primary-600 bg-white border-gray-300 rounded",
            "focus:ring-2 focus:ring-primary-500 focus:ring-offset-0",
            "dark:bg-gray-800 dark:border-gray-600",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="ml-2 text-sm text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
