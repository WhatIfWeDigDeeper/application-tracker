import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav data-testid="pagination" className="mt-4 flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        type="button"
      >
        Prev
      </Button>

      {pages.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => onPage(pageNumber)}
          type="button"
          className="h-8 min-w-8 rounded-md border px-2 text-sm"
          style={{
            background: pageNumber === page ? 'var(--accent)' : 'var(--bg-card)',
            color: pageNumber === page ? '#fff' : 'var(--text-primary)',
            borderColor: pageNumber === page ? 'var(--accent)' : 'var(--border-subtle)',
          }}
          aria-current={pageNumber === page ? 'page' : undefined}
        >
          {pageNumber}
        </button>
      ))}

      <Button
        variant="secondary"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        type="button"
      >
        Next
      </Button>
    </nav>
  );
}
