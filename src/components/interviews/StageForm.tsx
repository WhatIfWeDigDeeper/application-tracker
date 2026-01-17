'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { InterviewStage, InterviewStageInput } from '@/types/application';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validateInterviewStage } from '@/services/validation';
import { VALIDATION_LIMITS } from '@/lib/constants';
import { getCurrentDateISO, cn } from '@/lib/utils';

export interface StageFormProps {
  stage?: InterviewStage;
  onSubmit: (data: InterviewStageInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
  mode?: 'create' | 'edit';
}

export function StageForm({
  stage,
  onSubmit,
  onCancel,
  onDelete,
  mode = 'create',
}: StageFormProps): React.ReactElement {
  const [formData, setFormData] = useState<InterviewStageInput>({
    name: stage?.name ?? '',
    isCompleted: stage?.isCompleted ?? false,
    completedDate: stage?.completedDate ?? '',
    notes: stage?.notes ?? '',
    performanceRating: stage?.performanceRating,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type } = e.target;

    let parsedValue: string | boolean | number | undefined = value;

    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
      // Auto-set completion date when marking complete
      if (name === 'isCompleted' && parsedValue && !formData.completedDate) {
        setFormData((prev) => ({
          ...prev,
          isCompleted: true,
          completedDate: getCurrentDateISO(),
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRatingChange = (rating: number): void => {
    setFormData((prev) => ({
      ...prev,
      performanceRating: prev.performanceRating === rating ? undefined : rating,
    }));
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    const validation = validateInterviewStage(formData);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    const cleanData: InterviewStageInput = {
      name: formData.name,
      isCompleted: formData.isCompleted,
      completedDate: formData.isCompleted ? formData.completedDate || undefined : undefined,
      notes: formData.notes || undefined,
      performanceRating: formData.performanceRating || undefined,
    };

    onSubmit(cleanData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Stage Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
        placeholder="e.g., Technical Interview"
        maxLength={VALIDATION_LIMITS.stageName.max}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isCompleted"
          name="isCompleted"
          checked={formData.isCompleted ?? false}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="isCompleted" className="text-sm text-gray-700">
          Mark as completed
        </label>
      </div>

      {formData.isCompleted && (
        <Input
          label="Completion Date"
          name="completedDate"
          type="date"
          value={formData.completedDate ?? ''}
          onChange={handleChange}
          error={errors.completedDate}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Performance Rating (Optional)
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingChange(rating)}
              className={cn(
                'w-8 h-8 rounded transition-colors',
                formData.performanceRating !== undefined && rating <= formData.performanceRating
                  ? 'text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              )}
              aria-label={`Rate ${rating} out of 5`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          {formData.performanceRating && (
            <span className="ml-2 text-sm text-gray-500">
              {formData.performanceRating} / 5
            </span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes ?? ''}
          onChange={handleChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
          placeholder="Any notes about this interview stage..."
          maxLength={VALIDATION_LIMITS.stageNotes.max}
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <div>
          {mode === 'edit' && onDelete && (
            <Button type="button" variant="danger" onClick={onDelete}>
              Delete Stage
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === 'create' ? 'Add Stage' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
