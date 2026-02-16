import { useState, useEffect, useCallback } from "react";
import type { HistoryEntry } from "../../types/application";
import * as api from "../../services/api";
import { FieldDiff } from "./FieldDiff";

interface HistoryPanelProps {
  applicationId: string;
  refreshKey?: number;
  onClose: () => void;
  onRestored: () => void;
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return "Just now";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `${diffDays}d ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function HistoryPanel({
  applicationId,
  refreshKey,
  onClose,
  onRestored,
}: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getHistory(applicationId);
      setEntries(result.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshKey]);

  function toggleExpand(entryId: string) {
    setExpandedEntry((prev) => (prev === entryId ? null : entryId));
  }

  async function handleRestore(entry: HistoryEntry) {
    setRestoring(true);
    try {
      await api.restoreToVersion(applicationId, entry.sequence);
      await loadHistory();
      onRestored();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-40 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          History
        </h2>
        <button
          onClick={onClose}
          aria-label="Close history panel"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-6">
            No history entries yet.
          </p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <div key={entry.id}>
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    expandedEntry === entry.id
                      ? "bg-gray-50 dark:bg-gray-700/50"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {entry.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatRelativeTime(entry.createdAt)}
                      </p>
                    </div>
                    {i === 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        (current)
                      </span>
                    )}
                  </div>
                </button>

                {expandedEntry === entry.id && (
                  <div className="px-3 pb-3 space-y-3">
                    <FieldDiff changes={entry.changes} />
                    {i > 0 && (
                      <button
                        type="button"
                        className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium py-1.5 px-3 rounded-md border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                        disabled={restoring}
                        onClick={() => handleRestore(entry)}
                      >
                        {restoring ? "Restoring..." : "Restore to this point"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
