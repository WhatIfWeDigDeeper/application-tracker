'use client';

import type { InterviewStage as InterviewStageType } from '@/types/application';
import { CheckIcon, CheckCircleIcon } from '@/assets/icons/CheckIcon';
import { EditIcon } from '@/assets/icons/EditIcon';
import { DragIcon } from '@/assets/icons/DragIcon';
import { Button } from '@/components/ui/Button';
import { formatDate, cn } from '@/lib/utils';

export interface InterviewStageProps {
  stage: InterviewStageType;
  onToggleComplete: (stageId: string) => void;
  onEdit: (stage: InterviewStageType) => void;
  isDraggable?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function RatingStars({ rating }: { rating: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function InterviewStage({
  stage,
  onToggleComplete,
  onEdit,
  isDraggable = false,
  dragHandleProps,
}: InterviewStageProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        stage.isCompleted
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      )}
    >
      {isDraggable && (
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-0.5"
          aria-label="Drag to reorder"
        >
          <DragIcon className="w-5 h-5" />
        </div>
      )}

      <button
        type="button"
        onClick={() => onToggleComplete(stage.id)}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5',
          stage.isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-400'
        )}
        aria-label={stage.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {stage.isCompleted && <CheckIcon className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4
              className={cn(
                'font-medium',
                stage.isCompleted ? 'text-green-800' : 'text-gray-900'
              )}
            >
              {stage.name}
            </h4>
            {stage.isCompleted && stage.completedDate && (
              <p className="text-sm text-green-600 flex items-center gap-1 mt-0.5">
                <CheckCircleIcon className="w-4 h-4" />
                Completed {formatDate(stage.completedDate)}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(stage)}
            aria-label={`Edit ${stage.name}`}
          >
            <EditIcon className="w-4 h-4" />
          </Button>
        </div>

        {stage.performanceRating && (
          <div className="mt-2">
            <RatingStars rating={stage.performanceRating} />
          </div>
        )}

        {stage.notes && (
          <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{stage.notes}</p>
        )}
      </div>
    </div>
  );
}
