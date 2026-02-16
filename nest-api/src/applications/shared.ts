import type { Application, InterviewStage } from '../database/schema.js';
import type { ApplicationResponse } from '../types/api.js';

// Helper to format date for response
export function formatDate(date: string | Date | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

// Helper to format datetime for response
export function formatDateTime(date: Date | null): string {
  if (!date) return new Date().toISOString();
  return date.toISOString();
}

// Transform DB application to API response
export function toApplicationResponse(app: Application, stages: InterviewStage[]): ApplicationResponse {
  return {
    id: app.id,
    companyName: app.companyName,
    positionTitle: app.positionTitle,
    dateApplied: formatDate(app.dateApplied) || '',
    status: app.status,
    createdAt: formatDateTime(app.createdAt),
    updatedAt: formatDateTime(app.updatedAt),
    companyUrl: app.companyUrl,
    jobPostingUrl: app.jobPostingUrl,
    companyCareerUrl: app.companyCareerUrl,
    companyCategory: app.companyCategory,
    skillsMatch: app.skillsMatch,
    jobSource: app.jobSource,
    coverLetterRequired: app.coverLetterRequired,
    specialRequirements: app.specialRequirements,
    salaryMin: app.salaryMin,
    salaryMax: app.salaryMax,
    notes: app.notes,
    offerDueDate: formatDate(app.offerDueDate),
    isArchived: app.isArchived,
    interviewStages: stages
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        isCompleted: s.isCompleted,
        completedDate: formatDate(s.completedDate),
        notes: s.notes,
        performanceRating: s.performanceRating,
      })),
  };
}
