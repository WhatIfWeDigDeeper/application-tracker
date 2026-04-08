import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RatingDisplay } from '@/components/ui/Rating';
import { getTodayDate } from '@/lib/utils';
import type { InterviewStage, UpdateInterviewStageInput } from '@/types/application';
import { InterviewStageForm } from './InterviewStageForm';

interface InterviewStageItemProps {
  stage: InterviewStage;
  index: number;
  isCurrent: boolean;
  onUpdate: (stageId: string, payload: UpdateInterviewStageInput) => Promise<void>;
  onRemove: (stageId: string) => Promise<void>;
}

export function InterviewStageItem({ stage, index, isCurrent, onUpdate, onRemove }: InterviewStageItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const dotClass = stage.isCompleted
    ? 'bg-emerald-500'
    : isCurrent
      ? 'bg-amber-400'
      : 'bg-[var(--border-strong)]';

  return (
    <div data-testid="stage-item" className="relative rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
      <div className="flex items-start gap-3">
        <span className={`mt-1 inline-flex h-3 w-3 rounded-full ${dotClass}`} aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-[var(--text-primary)]">{stage.name}</div>
            <span className="text-xs text-[var(--text-secondary)]">Step {index + 1}</span>
            {stage.completedDate ? (
              <span className="text-xs text-[var(--text-secondary)]">Completed {stage.completedDate}</span>
            ) : null}
          </div>

          {stage.performanceRating != null ? (
            <div className="mt-1">
              <RatingDisplay value={stage.performanceRating} />
            </div>
          ) : null}

          {stage.notes ? <p className="mb-0 mt-2 text-sm text-[var(--text-secondary)]">{stage.notes}</p> : null}
        </div>

        <div className="flex items-center gap-1">
          <label className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={stage.isCompleted}
              onChange={(event) =>
                onUpdate(stage.id, {
                  isCompleted: event.target.checked,
                  completedDate: event.target.checked ? stage.completedDate || getTodayDate() : null,
                }).catch((caught: unknown) => {
                  setItemError(caught instanceof Error ? caught.message : 'Failed to update stage.');
                })
              }
            />
            Done
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((current) => !current)}>
            Edit
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {editing ? (
        <InterviewStageForm
          mode="edit"
          defaultOrder={stage.order}
          initialValues={stage}
          onSave={async (payload) => {
            await onUpdate(stage.id, payload as UpdateInterviewStageInput);
            setEditing(false);
          }}
          onDelete={async () => {
            await onRemove(stage.id);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : null}

      {itemError ? <div className="mt-1 text-xs text-[var(--status-rejected)]">{itemError}</div> : null}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete interview stage?"
        message="This stage will be removed permanently."
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          onRemove(stage.id)
            .then(() => setConfirmOpen(false))
            .catch((caught: unknown) => {
              setItemError(caught instanceof Error ? caught.message : 'Failed to delete stage.');
              setConfirmOpen(false);
            });
        }}
      />
    </div>
  );
}
