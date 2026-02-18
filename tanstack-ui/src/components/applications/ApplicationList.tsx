import { Link } from "@tanstack/react-router";
import type { Application } from "../../types/application";
import { ApplicationCard } from "./ApplicationCard";
import { EmptyState, Button, Pagination } from "../ui";

interface ApplicationListProps {
  applications: Application[];
  loading: boolean;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function ApplicationList({
  applications,
  loading,
  onArchive,
  onRestore,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  hasFilters,
  onClearFilters,
}: ApplicationListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    if (hasFilters) {
      return (
        <EmptyState
          icon={
            <svg
              className="w-12 h-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          }
          title="No applications match your filters"
          description="Try adjusting your filters to see more results."
          action={
            <Button variant="secondary" onClick={onClearFilters}>
              Clear Filters
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={
          <svg
            className="w-12 h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        title="No applications yet"
        description="Start tracking your job applications by adding your first one."
        action={
          <Link to="/applications/new">
            <Button variant="primary">Add Application</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 min-w-0">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onArchive={() =>
              application.isArchived
                ? onRestore(application.id)
                : onArchive(application.id)
            }
            onDelete={() => onDelete(application.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
