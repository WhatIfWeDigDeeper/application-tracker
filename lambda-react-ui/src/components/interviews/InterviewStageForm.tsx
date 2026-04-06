import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { RatingInput } from '@/components/ui/Rating';
import { getTodayDate } from '@/lib/utils';
import type { CreateInterviewStageInput, InterviewStage, UpdateInterviewStageInput } from '@/types/application';

interface InterviewStageFormProps {
  mode: 'create' | 'edit';
  defaultOrder: number;
  initialValues?: InterviewStage;
  saving?: boolean;
  onSave: (payload: CreateInterviewStageInput | UpdateInterviewStageInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export function InterviewStageForm({
  mode,
  defaultOrder,
  initialValues,
  saving = false,
  onSave,
  onDelete,
  onCancel,
}: InterviewStageFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [isCompleted, setIsCompleted] = useState(initialValues?.isCompleted ?? false);
  const [completedDate, setCompletedDate] = useState(initialValues?.completedDate ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [performanceRating, setPerformanceRating] = useState<number | null>(initialValues?.performanceRating ?? null);
  const [error, setError] = useState<string | null>(null);

  const handleCompletedToggle = (checked: boolean) => {
    setIsCompleted(checked);
    if (checked && !completedDate) {
      setCompletedDate(getTodayDate());
    }
    if (!checked) {
      setCompletedDate('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Stage name is required.');
      return;
    }

    setError(null);

    if (mode === 'create') {
      await onSave({
        name: name.trim(),
        order: defaultOrder,
        isCompleted,
        completedDate: isCompleted && completedDate ? completedDate : undefined,
        notes: notes.trim() || undefined,
        performanceRating,
      });
      return;
    }

    await onSave({
      name: name.trim(),
      isCompleted,
      completedDate: isCompleted ? completedDate || null : null,
      notes: notes.trim() || null,
      performanceRating,
    });
  };

  return (
    <form
      data-testid="stage-form"
      className="mt-2 rounded-md border border-[var(--border-subtle)] p-3"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-2">
        <Input
          label="Stage Name"
          placeholder={mode === 'create' ? 'Phone Screen, Technical Interview...' : 'e.g., Technical Interview'}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(event) => handleCompletedToggle(event.target.checked)}
          />
          Completed
        </label>

        {isCompleted ? (
          <Input
            label="Completed Date"
            type="date"
            value={completedDate}
            onChange={(event) => setCompletedDate(event.target.value)}
          />
        ) : null}

        <div>
          <div className="mb-1 text-sm font-medium text-[var(--text-primary)]">Performance Rating</div>
          <RatingInput value={performanceRating} onChange={setPerformanceRating} />
        </div>

        <TextArea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>

      {error ? <div className="mt-2 text-xs text-[var(--status-rejected)]">{error}</div> : null}

      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        {mode === 'edit' ? (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (onDelete) {
                void onDelete();
              }
            }}
          >
            Delete Stage
          </Button>
        ) : null}
        <Button type="button" onClick={() => void handleSave()} loading={saving}>
          <span data-testid="stage-form-save">{mode === 'create' ? 'Add Stage' : 'Save Stage'}</span>
        </Button>
      </div>
    </form>
  );
}
