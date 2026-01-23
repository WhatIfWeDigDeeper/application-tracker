import type {
  ApplicationStatus,
  CompanyCategory,
  JobSource,
} from "../types/application";

export const APPLICATION_STATUSES: {
  value: ApplicationStatus;
  label: string;
}[] = [
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "given offer", label: "Given Offer" },
  { value: "accepted offer", label: "Accepted Offer" },
  { value: "declined offer", label: "Declined Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "no offer", label: "No Offer" },
];

export const COMPANY_CATEGORIES: {
  value: CompanyCategory;
  label: string;
}[] = [
  { value: "ai", label: "AI" },
  { value: "climate", label: "Climate" },
  { value: "consulting", label: "Consulting" },
  { value: "consumer-tech", label: "Consumer Tech" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "e-commerce", label: "E-commerce" },
  { value: "education", label: "Education" },
  { value: "energy", label: "Energy" },
  { value: "enterprise-software", label: "Enterprise Software" },
  { value: "finance", label: "Finance" },
  { value: "gaming", label: "Gaming" },
  { value: "government", label: "Government" },
  { value: "health", label: "Health" },
  { value: "hospitality", label: "Hospitality" },
  { value: "media-entertainment", label: "Media/Entertainment" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
];

export const JOB_SOURCES: { value: JobSource; label: string }[] = [
  { value: "recruiter", label: "Recruiter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "friend", label: "Friend" },
  { value: "colleague", label: "Colleague" },
  { value: "company-website", label: "Company Website" },
  { value: "other", label: "Other" },
];

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  interviewing:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "given offer":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "accepted offer":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "declined offer":
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "no offer": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

export const DEFAULT_INTERVIEW_STAGES = [
  "Contacted by Recruiter",
  "Interview with Recruiter",
  "Interview with Hiring Manager",
  "Exercise",
  "Technical Interview",
  "Cross-functional Interviews",
];
