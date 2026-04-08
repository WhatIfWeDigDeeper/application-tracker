import { Button } from './Button';

interface RatingDisplayProps {
  value: number | null;
}

interface RatingInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

function starClass(active: boolean): string {
  return active ? 'text-amber-400' : 'text-[var(--border-strong)]';
}

export function RatingDisplay({ value }: RatingDisplayProps) {
  const normalized = value ?? 0;
  return (
    <div className="inline-flex items-center gap-1" aria-label={`Rating ${normalized} of 5`}>
      {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
        <span key={star} className={starClass(star <= normalized)} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

export function RatingInput({ value, onChange, disabled = false }: RatingInputProps) {
  const normalized = value ?? 0;

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label="Rating input">
      {Array.from({ length: 5 }, (_, index) => index + 1).map((star) => (
        <Button
          key={star}
          type="button"
          size="sm"
          variant="ghost"
          className={`h-8 min-w-8 px-1 ${starClass(star <= normalized)}`}
          disabled={disabled}
          onClick={() => onChange(star === normalized ? null : star)}
          aria-label={`Set rating to ${star}`}
        >
          ★
        </Button>
      ))}
    </div>
  );
}
