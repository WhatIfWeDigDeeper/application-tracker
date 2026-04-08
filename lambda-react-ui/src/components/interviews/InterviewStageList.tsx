import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useApplicationStore } from '@/stores/applicationStore';
import type { CreateInterviewStageInput, InterviewStage, UpdateInterviewStageInput } from '@/types/application';
import { InterviewStageForm } from './InterviewStageForm';
import { InterviewStageItem } from './InterviewStageItem';

interface InterviewStageListProps {
  appId: string;
  stages: InterviewStage[];
}

export function InterviewStageList({ appId, stages }: InterviewStageListProps) {
  const [creating, setCreating] = useState(false);
  const addStage = useApplicationStore((state) => state.addStage);
  const updateStage = useApplicationStore((state) => state.updateStage);
  const removeStage = useApplicationStore((state) => state.removeStage);
  const addDefaultStages = useApplicationStore((state) => state.addDefaultStages);

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages]
  );
  const completedCount = sortedStages.filter((stage) => stage.isCompleted).length;
  const firstIncompleteId = sortedStages.find((stage) => !stage.isCompleted)?.id;

  const handleCreate = async (payload: CreateInterviewStageInput | UpdateInterviewStageInput) => {
    await addStage(appId, payload as CreateInterviewStageInput);
    setCreating(false);
  };

  return (
    <section data-testid="interview-stage-list" className="space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-[var(--text-primary)]">Interview Progress</div>
          <div className="text-xs text-[var(--text-secondary)]">
            {completedCount} / {sortedStages.length || 0} completed
          </div>
        </div>
        <div className="mt-1 h-2 rounded-full bg-[var(--border-subtle)]">
          <div
            className="h-2 rounded-full bg-emerald-500"
            style={{
              width:
                sortedStages.length === 0
                  ? '0%'
                  : `${Math.round((completedCount / sortedStages.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      {sortedStages.length === 0 ? (
        <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-secondary)]">
          No interview stages yet.
        </div>
      ) : null}

      {sortedStages.map((stage, index) => (
        <InterviewStageItem
          key={stage.id}
          stage={stage}
          index={index}
          isCurrent={!stage.isCompleted && stage.id === firstIncompleteId}
          onUpdate={(stageId, payload) => updateStage(appId, stageId, payload)}
          onRemove={(stageId) => removeStage(appId, stageId)}
        />
      ))}

      {creating ? (
        <InterviewStageForm
          mode="create"
          defaultOrder={sortedStages.length}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => setCreating(true)}>
            Add Stage
          </Button>
          {sortedStages.length === 0 ? (
            <Button type="button" size="sm" onClick={() => void addDefaultStages(appId)}>
              Add Default Stages
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
