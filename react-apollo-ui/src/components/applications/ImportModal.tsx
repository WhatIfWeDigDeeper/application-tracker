import { useState, useRef } from 'react';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

interface ImportModalProps {
  onClose: () => void;
}

export function ImportModal({ onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    const fileToUpload = fileRef.current?.files?.[0] ?? file;
    if (!fileToUpload) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const res = await fetch('/api/applications/import', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        setError(`Import failed: ${res.statusText}`);
        return;
      }
      const data = await res.json() as ImportResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div role="dialog" className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import Applications</h2>
          <button type="button" onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          Upload a CSV file with application data.{' '}
          <a href="/api/applications/sample-csv" download="applications-template.csv"
            className="text-blue-600 hover:underline">
            Download template
          </a>
        </p>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            onInput={(e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) setFile(f);
            }}
            className="w-full text-sm text-gray-600 dark:text-gray-300"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/20 rounded font-medium text-green-800 dark:text-green-300">
                Imported: <span className="text-2xl font-bold text-green-700 dark:text-green-400">{result.imported}</span>
              </div>
              <div className="flex-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded font-medium text-yellow-800 dark:text-yellow-300">
                Skipped: <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{result.skipped}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div data-testid="import-result-errors" className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="font-medium text-red-700 dark:text-red-300 text-sm mb-2">
                  {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                </div>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600 dark:text-red-400">
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
            Close
          </button>
          {!result && (
            <button type="button" onClick={handleImport} disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Importing...' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
