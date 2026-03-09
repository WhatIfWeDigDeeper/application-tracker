import { gql } from '@apollo/client';

export const APPLICATION_FIELDS = gql`
  fragment ApplicationFields on Application {
    id companyName positionTitle status dateApplied jobPostingUrl companyWebsiteUrl
    companyCategory jobSource salaryMin salaryMax skillsMatch notes contactName
    contactEmail offerDueDate isArchived createdAt updatedAt
  }
`;

export const GET_APPLICATIONS = gql`
  ${APPLICATION_FIELDS}
  query GetApplications(
    $status: ApplicationStatus $companyCategory: CompanyCategory $jobSource: JobSource
    $skillsMatchMin: Int $includeArchived: Boolean $sortBy: String $sortDir: String
    $page: Int $limit: Int
  ) {
    applications(
      status: $status companyCategory: $companyCategory jobSource: $jobSource
      skillsMatchMin: $skillsMatchMin includeArchived: $includeArchived
      sortBy: $sortBy sortDir: $sortDir page: $page limit: $limit
    ) {
      items { ...ApplicationFields }
      total page totalPages
    }
  }
`;

export const GET_APPLICATION = gql`
  ${APPLICATION_FIELDS}
  query GetApplication($id: ID!) {
    application(id: $id) {
      ...ApplicationFields
      interviewStages { id applicationId stageName stageOrder scheduledDate notes createdAt updatedAt }
    }
  }
`;

export const GET_HISTORY = gql`
  query GetHistory($applicationId: ID!, $page: Int, $limit: Int) {
    applicationHistory(applicationId: $applicationId, page: $page, limit: $limit) {
      items { id applicationId sequence snapshot changedFields createdAt }
      total page totalPages
    }
  }
`;
