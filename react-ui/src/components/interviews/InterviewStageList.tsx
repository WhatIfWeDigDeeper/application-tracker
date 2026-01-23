import { useState } from "react";
import type {
  InterviewStage,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../../types/application";
import { Button } from "../ui";
import { InterviewStageItem } from "./InterviewStageItem";
import { InterviewStageForm } from "./InterviewStageForm";
import { DEFAULT_INTERVIEW_STAGES } from "../../lib/constants";

interface InterviewStageListProps {
  stages: InterviewStage[];
  onAdd: (input: CreateInterviewStageInput) => Promise<void>;
  onUpdate: (stageId: string, input: UpdateInterviewStageInput) => Promise<void>;
  onRemove: (stageId: string) => Promise<void>;
}

export function InterviewStageList({
  stages,
  onAdd,
  onUpdate,
  onRemove,
}: InterviewStageListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingStage, setEditingStage] = useState<InterviewStage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const completedCount = stages.filter((s) => s.isCompleted).length;
  const nextOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order)) + 1 : 0;

  const handleAddStage = async (
    data: CreateInterviewStageInput | UpdateInterviewStageInput
  ) => {
    setIsLoading(true);
    try {
      await onAdd(data as CreateInterviewStageInput);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStage = async (data: UpdateInterviewStageInput) => {
    if (!editingStage) return;
    setIsLoading(true);
    try {
      await onUpdate(editingStage.id, data);
      setEditingStage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (
    stage: InterviewStage,
    isCompleted: boolean,
    completedDate?: string
  ) => {
    await onUpdate(stage.id, { isCompleted, completedDate });
  };

  const handleAddDefaults = async () => {
    setIsLoading(true);
    try {
      for (let i = 0; i < DEFAULT_INTERVIEW_STAGES.length; i++) {
        await onAdd({
          name: DEFAULT_INTERVIEW_STAGES[i],
          order: nextOrder + i,
          isCompleted: false,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress Summary */}
      {stages.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {completedCount} of {stages.length} completed
          </span>
          <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{
                width: `${stages.length > 0 ? (completedCount / stages.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stage List */}
      {sortedStages.length > 0 ? (
        <div className="space-y-2">
          {sortedStages.map((stage) => (
            <InterviewStageItem
              key={stage.id}
              stage={stage}
              onToggleComplete={(isCompleted, completedDate) =>
                handleToggleComplete(stage, isCompleted, completedDate)
              }
              onEdit={() => setEditingStage(stage)}
              onDelete={() => onRemove(stage.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p className="mb-3">No interview stages yet</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddDefaults}
            disabled={isLoading}
          >
            {isLoading ? "Adding..." : "Add Default Stages"}
          </Button>
        </div>
      )}

      {/* Add Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowForm(true)}
        className="w-full justify-center"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Stage
      </Button>

      {/* Add/Edit Form Modal */}
      <InterviewStageForm
        isOpen={showForm || !!editingStage}
        onClose={() => {
          setShowForm(false);
          setEditingStage(null);
        }}
        onSubmit={editingStage ? handleUpdateStage : handleAddStage}
        stage={editingStage}
        nextOrder={nextOrder}
        isLoading={isLoading}
      />
    </div>
  );
}
