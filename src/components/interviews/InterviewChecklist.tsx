'use client';

import { useState } from 'react';
import type { InterviewStage as InterviewStageType, InterviewStageInput } from '@/types/application';
import { InterviewStage } from './InterviewStage';
import { StageForm } from './StageForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PlusIcon } from '@/assets/icons/PlusIcon';
import { generateId, getCurrentDateISO } from '@/lib/utils';
import { DEFAULT_INTERVIEW_STAGES } from '@/lib/constants';

export interface InterviewChecklistProps {
  stages: InterviewStageType[];
  onStagesChange: (stages: InterviewStageType[]) => void;
  isEditable?: boolean;
}

export function InterviewChecklist({
  stages,
  onStagesChange,
  isEditable = true,
}: InterviewChecklistProps): React.ReactElement {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<InterviewStageType | null>(null);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const handleToggleComplete = (stageId: string): void => {
    const updatedStages = stages.map((stage) => {
      if (stage.id === stageId) {
        return {
          ...stage,
          isCompleted: !stage.isCompleted,
          completedDate: !stage.isCompleted ? getCurrentDateISO() : undefined,
        };
      }
      return stage;
    });
    onStagesChange(updatedStages);
  };

  const handleEditStage = (stage: InterviewStageType): void => {
    setEditingStage(stage);
    setIsFormOpen(true);
  };

  const handleAddStage = (): void => {
    setEditingStage(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: InterviewStageInput): void => {
    if (editingStage) {
      // Update existing stage
      const updatedStages = stages.map((stage) => {
        if (stage.id === editingStage.id) {
          return {
            ...stage,
            name: data.name,
            isCompleted: data.isCompleted ?? false,
            completedDate: data.completedDate,
            notes: data.notes,
            performanceRating: data.performanceRating,
          };
        }
        return stage;
      });
      onStagesChange(updatedStages);
    } else {
      // Add new stage
      const maxOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order)) : -1;
      const newStage: InterviewStageType = {
        id: generateId(),
        name: data.name,
        order: maxOrder + 1,
        isCompleted: data.isCompleted ?? false,
        completedDate: data.completedDate,
        notes: data.notes,
        performanceRating: data.performanceRating,
      };
      onStagesChange([...stages, newStage]);
    }
    setIsFormOpen(false);
    setEditingStage(null);
  };

  const handleDeleteStage = (): void => {
    if (editingStage) {
      const updatedStages = stages
        .filter((stage) => stage.id !== editingStage.id)
        .map((stage, index) => ({ ...stage, order: index }));
      onStagesChange(updatedStages);
      setIsFormOpen(false);
      setEditingStage(null);
    }
  };

  const handleFormCancel = (): void => {
    setIsFormOpen(false);
    setEditingStage(null);
  };

  const handleResetToDefault = (): void => {
    const defaultStages: InterviewStageType[] = DEFAULT_INTERVIEW_STAGES.map((stage) => ({
      ...stage,
      id: generateId(),
    }));
    onStagesChange(defaultStages);
  };

  const completedCount = stages.filter((s) => s.isCompleted).length;
  const totalCount = stages.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Interview Progress</h3>
        {isEditable && (
          <div className="flex gap-2">
            {stages.length === 0 && (
              <Button variant="secondary" size="sm" onClick={handleResetToDefault}>
                Use Default Stages
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleAddStage}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Stage
            </Button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {completedCount} of {totalCount} stages completed
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Stage List */}
      {sortedStages.length > 0 ? (
        <div className="space-y-2">
          {sortedStages.map((stage) => (
            <InterviewStage
              key={stage.id}
              stage={stage}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditStage}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No interview stages yet.</p>
          {isEditable && (
            <p className="mt-1 text-sm">
              Click &quot;Add Stage&quot; or &quot;Use Default Stages&quot; to get started.
            </p>
          )}
        </div>
      )}

      {/* Stage Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormCancel}
        title={editingStage ? 'Edit Stage' : 'Add Interview Stage'}
        size="md"
      >
        <StageForm
          stage={editingStage ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          onDelete={editingStage ? handleDeleteStage : undefined}
          mode={editingStage ? 'edit' : 'create'}
        />
      </Modal>
    </div>
  );
}
