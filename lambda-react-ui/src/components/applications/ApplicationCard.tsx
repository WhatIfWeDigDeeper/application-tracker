import type { MouseEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatSalaryRange, getDaysUntil, isOverdue } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Application } from '@/types/application';

interface ApplicationCardProps {
  application: Application;
  viewMode: 'grid' | 'list';
  selected: boolean;
  onSelect: (id: string) => void;
  onToggleMenu: (id: string, event: MouseEvent<HTMLButtonElement>) => void;
}

export function ApplicationCard({
  application,
  viewMode,
  selected,
  onSelect,
  onToggleMenu,
}: ApplicationCardProps) {
  const initials = `${application.companyName.charAt(0)}${application.positionTitle.charAt(0)}`.toUpperCase();
  const daysUntilOffer = getDaysUntil(application.offerDueDate);
  const days = daysUntilOffer ?? 0;
  const showOfferBanner = application.status === 'given offer' && daysUntilOffer != null && daysUntilOffer <= 7;

  return (
    <article
      data-testid="application-card"
      onClick={() => onSelect(application.id)}
      className="cursor-pointer rounded-lg border bg-[var(--bg-card)] p-4 transition-all hover:-translate-y-0.5 hover:bg-[var(--bg-card-hover)]"
      style={{
        borderColor: selected ? 'var(--accent)' : 'var(--border-subtle)',
        borderLeftWidth: '4px',
        borderLeftColor: 'var(--accent)',
        opacity: application.isArchived ? 0.7 : 1,
      }}
    >
      <div className={viewMode === 'list' ? 'flex items-center gap-3' : ''}>
        <div
          aria-hidden="true"
          className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #22c55e)',
            marginBottom: viewMode === 'list' ? 0 : undefined,
          }}
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="m-0 truncate text-sm font-semibold text-[var(--text-primary)]">{application.companyName}</h3>
              <p className="m-0 truncate text-sm text-[var(--text-secondary)]">{application.positionTitle}</p>
            </div>
            <Button
              aria-label="Actions"
              data-testid="actions-menu-button"
              variant="ghost"
              size="sm"
              className="relative z-20 self-start"
              onClick={(event) => onToggleMenu(application.id, event)}
              type="button"
            >
              ...
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge status={application.status} />
            <span className="text-xs text-[var(--text-secondary)]">{formatDate(application.dateApplied)}</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {formatSalaryRange(application.salaryMin, application.salaryMax)}
            </span>
          </div>
        </div>
      </div>

      {showOfferBanner ? (
        <div
          className="mt-3 rounded-md px-2 py-1 text-xs font-medium"
          style={{
            background: isOverdue(application.offerDueDate)
              ? 'var(--status-rejected-bg)'
              : 'var(--status-interviewing-bg)',
            color: isOverdue(application.offerDueDate)
              ? 'var(--status-rejected)'
              : 'var(--status-interviewing)',
          }}
        >
          {isOverdue(application.offerDueDate)
            ? `Offer overdue by ${Math.abs(days)} day(s)`
            : `Offer expires in ${days} day(s)`}
        </div>
      ) : null}
    </article>
  );
}
