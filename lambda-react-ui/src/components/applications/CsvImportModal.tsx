import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { downloadSampleCSV, importCSV } from '@/services/api';
import type { ImportResult } from '@/types/application';

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported?: () => Promise<void>;
}

export function CsvImportModal({ open, onClose, onImported }: CsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!file) {
      setError(null);
      fileInputRef.current?.click();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await importCSV(file);
      setResult(response);
      if (onImported) {
        await onImported();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div
        data-testid="import-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Import Applications"
        className="w-full max-w-lg rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4"
      >
        <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">Import Applications</h2>

        <div className="mt-3 space-y-3">
          <input
            ref={fileInputRef}
            data-testid="import-file-input"
            type="file"
            accept=".csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="sample-csv-btn"
              className="inline-flex h-8 items-center rounded-md border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
              onClick={() => {
                downloadSampleCSV().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Download failed'));
              }}
            >
              Download template
            </button>
            <Button data-testid="import-btn" type="button" loading={loading} onClick={() => void handleImport()}>
              Import
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>

          {error ? <div className="text-sm text-[var(--status-rejected)]">{error}</div> : null}

          {result ? (
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <div>Imported: {result.imported}</div>
              <div>Skipped: {result.skipped}</div>
              <div data-testid="import-result-errors">Failed: {result.failed}</div>
              {result.errors.length > 0 ? (
                <ul className="m-0 list-disc pl-5 text-xs text-[var(--status-rejected)]">
                  {result.errors.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
