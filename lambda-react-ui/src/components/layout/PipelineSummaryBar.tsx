import { useMemo } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import type { Application, ApplicationStatus } from '@/types/application';

interface PipelineSummaryBarProps {
  applications: Application[];
}

interface Segment {
  label: string;
  statuses: ApplicationStatus[];
  color: string;
}

const segments: Segment[] = [
  { label: 'Draft', statuses: ['unsubmitted'], color: 'var(--status-unsubmitted)' },
  { label: 'Applied', statuses: ['applied'], color: 'var(--status-applied)' },
  { label: 'Interviewing', statuses: ['interviewing'], color: 'var(--status-interviewing)' },
  {
    label: 'Offered',
    statuses: ['given offer', 'accepted offer', 'declined offer'],
    color: 'var(--status-given-offer)',
  },
  { label: 'Finalized', statuses: ['rejected', 'no offer'], color: 'var(--status-rejected)' },
];

export function PipelineSummaryBar({ applications }: PipelineSummaryBarProps) {
  const selectedStatuses = useFilterStore((state) => state.status);
  const setStatusFilter = useFilterStore((state) => state.setStatusFilter);

  const counts = useMemo(
    () =>
      segments.map((segment) => ({
        ...segment,
        count: applications.filter((app) => segment.statuses.includes(app.status)).length,
      })),
    [applications]
  );

  return (
    <div className="flex flex-wrap gap-2 md:flex-nowrap">
      {counts.map((segment) => {
        const active =
          selectedStatuses.length > 0 &&
          selectedStatuses.length === segment.statuses.length &&
          selectedStatuses.every((status) => segment.statuses.includes(status));

        return (
          <button
            key={segment.label}
            onClick={() => setStatusFilter(segment.statuses)}
            type="button"
            className="min-w-[140px] rounded-md border p-3 text-left"
            style={{
              borderColor: active ? segment.color : 'var(--border-subtle)',
              borderTopWidth: '3px',
              borderTopColor: segment.color,
              background: active ? segment.color : 'var(--bg-card)',
              color: active ? '#fff' : 'var(--text-primary)',
              flex: 1,
            }}
          >
            <div className="text-xs opacity-80">{segment.label}</div>
            <div className="text-xl font-semibold">{segment.count}</div>
          </button>
        );
      })}
    </div>
  );
}
