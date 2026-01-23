import { cn } from "../../lib/utils";

interface RatingDisplayProps {
  value: number | null;
  max?: number;
  showNumeric?: boolean;
  size?: "sm" | "md";
}

export function RatingDisplay({
  value,
  max = 5,
  showNumeric = false,
  size = "md",
}: RatingDisplayProps) {
  if (value === null) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, i) => (
        <svg
          key={i}
          className={cn(
            sizeClasses[size],
            i < value
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {showNumeric && (
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {value}/{max}
        </span>
      )}
    </div>
  );
}

interface RatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  max?: number;
  allowClear?: boolean;
  size?: "sm" | "md";
}

export function RatingInput({
  value,
  onChange,
  max = 5,
  allowClear = true,
  size = "md",
}: RatingInputProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
  };

  const handleClick = (rating: number) => {
    if (allowClear && value === rating) {
      onChange(null);
    } else {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, i) => {
        const rating = i + 1;
        const isFilled = value !== null && i < value;

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(rating)}
            className={cn(
              "transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded",
              isFilled
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 hover:text-yellow-300 dark:text-gray-600 dark:hover:text-yellow-400"
            )}
            aria-label={`Rate ${rating} of ${max}`}
          >
            <svg
              className={sizeClasses[size]}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
