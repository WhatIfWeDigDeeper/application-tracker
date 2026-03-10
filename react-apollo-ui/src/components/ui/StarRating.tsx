interface StarRatingProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function StarRating({ value, onChange, id }: StarRatingProps) {
  const current = value ? parseInt(value, 10) : 0;

  return (
    <div id={id} className="flex gap-1 py-1" role="group" aria-label="Skills match rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          onClick={() => onChange(current === star ? '' : String(star))}
          className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
          style={{ color: star <= current ? '#f59e0b' : '#6b7280' }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
