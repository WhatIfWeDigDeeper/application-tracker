import type { FieldChange } from '@/types/application';

interface FieldDiffProps {
  changes: FieldChange[];
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function FieldDiff({ changes }: FieldDiffProps): React.ReactElement {
  if (changes.length === 0) {
    return (
      <p className="text-sm italic text-gray-500 dark:text-gray-400">No field changes recorded</p>
    );
  }

  return (
    <div className="space-y-2">
      {changes.map((change) => (
        <div key={change.field} className="text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-400">{change.label}:</span>
          <div className="ml-2">
            {change.oldValue !== null && change.oldValue !== undefined && (
              <>
                <span className="text-red-600 dark:text-red-400 line-through">
                  {formatValue(change.oldValue)}
                </span>
                <span className="mx-1 text-gray-400">&rarr;</span>
              </>
            )}
            <span className="text-green-600 dark:text-green-400">
              {formatValue(change.newValue)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
