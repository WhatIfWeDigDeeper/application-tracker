export type ApplicationStatus = 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn' | 'archived';
export type CompanyCategory = 'enterprise-software' | 'startup' | 'mid-market' | 'agency' | 'government' | 'nonprofit' | 'other';
export type JobSource = 'linkedin' | 'indeed' | 'referral' | 'company-website' | 'recruiter' | 'job-board' | 'other';

export interface InterviewStage {
  id: string; applicationId: string; stageName: string; stageOrder: number;
  scheduledDate?: string | null; notes?: string | null; createdAt: string; updatedAt: string;
}

export interface Application {
  id: string; companyName: string; positionTitle: string; status: ApplicationStatus;
  dateApplied?: string | null; jobPostingUrl?: string | null; companyWebsiteUrl?: string | null;
  companyCategory?: CompanyCategory | null; jobSource?: JobSource | null;
  salaryMin?: number | null; salaryMax?: number | null; skillsMatch?: number | null;
  notes?: string | null; contactName?: string | null; contactEmail?: string | null;
  offerDueDate?: string | null; isArchived: boolean; createdAt: string; updatedAt: string;
  interviewStages?: InterviewStage[];
}

export interface HistoryEntry {
  id: string; applicationId: string; sequence: number;
  snapshot: string; changedFields: string; createdAt: string;
}

export interface ApplicationListResult {
  items: Application[]; total: number; page: number; totalPages: number;
}

export interface HistoryListResult {
  items: HistoryEntry[]; total: number; page: number; totalPages: number;
}
