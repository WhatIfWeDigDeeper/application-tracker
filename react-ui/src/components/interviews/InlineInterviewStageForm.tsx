import { useState, useEffect } from "react";
import type {
  InterviewStage,
  CreateInterviewStageInput,
  UpdateInterviewStageInput,
} from "../../types/application";
import { Button, Input, TextArea, Checkbox, RatingInput } from "../ui";
import { getTodayDate } from "../../lib/utils";

interface InlineInterviewStageFormProps {
  onSubmit: (
    data: CreateInterviewStageInput | UpdateInterviewStageInput
  ) => void;
  onCancel: () => void;
  stage?: InterviewStage | null;
  nextOrder: number;
}

export function InlineInterviewStageForm({
  onSubmit,
  onCancel,
  stage,
  nextOrder,
}: InlineInterviewStageFormProps) {
  const isEdit = !!stage;

  const [name, setName] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedDate, setCompletedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [performanceRating, setPerformanceRating] = useState<number | null>(
    null
  );
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
  }, [stage]);

  const handleSubmit = (e: React.FormEvent) => {
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

    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4"
    >
      <Input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
        error={error}
        placeholder="Phone Screen, Technical Interview..."
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
        <RatingInput value={performanceRating} onChange={setPerformanceRating} />
      </div>

      <TextArea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="How did it go? Any feedback?"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? "Save Changes" : "Add Stage"}</Button>
      </div>
    </form>
  );
}
