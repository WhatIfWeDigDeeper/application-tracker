import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldDiff } from './FieldDiff';
import { useApplicationStore } from '@/stores/applicationStore';
import { useUiStore } from '@/stores/uiStore';
import { listHistory } from '@/services/api';
import type { HistoryEntry } from '@/types/application';

interface HistoryPanelProps {
  applicationId: string;
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HistoryPanel({ applicationId }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const restoreToVersion = useApplicationStore((state) => state.restoreToVersion);
  const closePanel = useUiStore((state) => state.closePanel);

  useEffect(() => {
    setEntries([]);
    setPage(1);
  }, [applicationId]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listHistory(applicationId, page, 20);
        if (cancelled) {
          return;
        }

        setEntries((current) => (page === 1 ? response.entries : [...current, ...response.entries]));
        setTotal(response.total);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Failed to load history');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    let followUpTimer: ReturnType<typeof setTimeout> | null = null;
    if (page === 1) {
      followUpTimer = setTimeout(() => {
        void load();
      }, 800);
    }

    return () => {
      cancelled = true;
      if (followUpTimer) {
        clearTimeout(followUpTimer);
      }
    };
  }, [applicationId, page]);

  const latestSequence = entries.length > 0 ? Math.max(...entries.map((entry) => entry.sequence)) : null;

  return (
    <div data-testid="history-panel" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-base font-semibold text-[var(--text-primary)]">History</h2>
        <Button type="button" size="sm" variant="ghost" onClick={closePanel}>
          X
        </Button>
      </div>

      {error ? <div className="text-sm text-[var(--status-rejected)]">{error}</div> : null}
      {entries.map((entry) => (
        <article
          key={entry.id}
          data-testid="history-entry"
          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {entry.description}
                {entry.sequence === latestSequence ? ' (current)' : ''}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{formatRelativeTime(entry.createdAt)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setExpandedEntryId((current) => (current === entry.id ? null : entry.id))
                }
              >
                Details
              </Button>
              {expandedEntryId === entry.id && entry.sequence !== latestSequence ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void restoreToVersion(applicationId, entry.sequence);
                  }}
                >
                  Restore to this point
                </Button>
              ) : null}
            </div>
          </div>

          {expandedEntryId === entry.id && entry.changes.length > 0 ? (
            <div className="mt-2 space-y-1">
              {entry.changes.map((change) => (
                <FieldDiff
                  key={`${entry.id}-${change.field}`}
                  label={change.label}
                  oldValue={change.oldValue}
                  newValue={change.newValue}
                />
              ))}
            </div>
          ) : null}
        </article>
      ))}

      {loading ? <div className="text-sm text-[var(--text-secondary)]">Loading history...</div> : null}

      {!loading && entries.length < total ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => setPage((current) => current + 1)}>
          Load more
        </Button>
      ) : null}
    </div>
  );
}
