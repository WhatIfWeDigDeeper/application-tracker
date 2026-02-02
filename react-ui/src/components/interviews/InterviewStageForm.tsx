import { useState, useEffect } from "react";
import type {
  InterviewStage,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../../types/application";
import { Button, Input, TextArea, Checkbox, RatingInput, Modal } from "../ui";
import { getTodayDate } from "../../lib/utils";

interface InterviewStageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInterviewStageInput | UpdateInterviewStageInput) => Promise<void>;
  stage?: InterviewStage | null;
  nextOrder: number;
  isLoading?: boolean;
}

export function InterviewStageForm({
  isOpen,
  onClose,
  onSubmit,
  stage,
  nextOrder,
  isLoading = false,
}: InterviewStageFormProps) {
  const isEdit = !!stage;

  const [name, setName] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedDate, setCompletedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [performanceRating, setPerformanceRating] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (stage) {
      setName(stage.name);
      setIsCompleted(stage.isCompleted);
      setCompletedDate(stage.completedDate || "");
      setNotes(stage.notes || "");
      setPerformanceRating(stage.performanceRating);
    } else {
      setName("");
      setIsCompleted(false);
      setCompletedDate("");
      setNotes("");
      setPerformanceRating(null);
    }
    setError("");
  }, [stage, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Stage name is required");
      return;
    }

    const data: CreateInterviewStageInput | UpdateInterviewStageInput = {
      name: name.trim(),
      order: stage?.order ?? nextOrder,
      isCompleted,
      completedDate: isCompleted ? completedDate || getTodayDate() : undefined,
      notes: notes || undefined,
      performanceRating: performanceRating || undefined,
    };

    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Interview Stage" : "Add Interview Stage"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Stage Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          error={error}
          placeholder="e.g., Technical Interview"
          required
        />

        <Checkbox
          label="Completed"
          checked={isCompleted}
          onChange={(e) => setIsCompleted(e.target.checked)}
        />

        {isCompleted && (
          <Input
            label="Completion Date"
            type="date"
            value={completedDate}
            onChange={(e) => setCompletedDate(e.target.value)}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Performance Rating
          </label>
          <RatingInput
            value={performanceRating}
            onChange={setPerformanceRating}
          />
        </div>

        <TextArea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How did it go? Any feedback?"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Add Stage"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
