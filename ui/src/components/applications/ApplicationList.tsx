'use client';

import type { JobApplication } from '@/types/application';
import { ApplicationCard } from './ApplicationCard';
import { EmptyState, EmptyStateIcon } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@/assets/icons/PlusIcon';

export interface ApplicationListProps {
  applications: JobApplication[];
  isLoading?: boolean;
  onAddNew: () => void;
  onSelectApplication: (application: JobApplication) => void;
  onEditApplication?: (application: JobApplication) => void;
  onArchiveApplication?: (id: string) => void;
  onDeleteApplication?: (id: string) => void;
  onRestoreApplication?: (id: string) => void;
}

export function ApplicationList({
  applications,
  isLoading = false,
  onAddNew,
  onSelectApplication,
  onArchiveApplication,
  onRestoreApplication,
}: ApplicationListProps): React.ReactElement {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<EmptyStateIcon />}
        title="No applications yet"
        description="Start tracking your job search by adding your first application."
        action={
          <Button onClick={onAddNew}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Application
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onClick={() => onSelectApplication(application)}
          onArchive={onArchiveApplication ? () => onArchiveApplication(application.id) : undefined}
          onRestore={onRestoreApplication ? () => onRestoreApplication(application.id) : undefined}
        />
      ))}
    </div>
  );
}
