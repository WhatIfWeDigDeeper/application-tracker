import { gql } from '@apollo/client';
import { APPLICATION_FIELDS } from './queries.js';

export const CREATE_APPLICATION = gql`
  ${APPLICATION_FIELDS}
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) { ...ApplicationFields }
  }
`;

export const UPDATE_APPLICATION = gql`
  ${APPLICATION_FIELDS}
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      ...ApplicationFields
      interviewStages { id applicationId stageName stageOrder scheduledDate notes createdAt updatedAt }
    }
  }
`;

export const DELETE_APPLICATION = gql`
  mutation DeleteApplication($id: ID!) { deleteApplication(id: $id) }
`;

export const ARCHIVE_APPLICATION = gql`
  ${APPLICATION_FIELDS}
  mutation ArchiveApplication($id: ID!) { archiveApplication(id: $id) { ...ApplicationFields } }
`;

export const RESTORE_APPLICATION = gql`
  ${APPLICATION_FIELDS}
  mutation RestoreApplication($id: ID!) { restoreApplication(id: $id) { ...ApplicationFields } }
`;

export const CREATE_STAGE = gql`
  mutation CreateStage($applicationId: ID!, $input: StageInput!) {
    createStage(applicationId: $applicationId, input: $input) {
      id applicationId stageName stageOrder scheduledDate notes createdAt updatedAt
    }
  }
`;

export const UPDATE_STAGE = gql`
  mutation UpdateStage($applicationId: ID!, $stageId: ID!, $input: StageInput!) {
    updateStage(applicationId: $applicationId, stageId: $stageId, input: $input) {
      id applicationId stageName stageOrder scheduledDate notes createdAt updatedAt
    }
  }
`;

export const DELETE_STAGE = gql`
  mutation DeleteStage($applicationId: ID!, $stageId: ID!) {
    deleteStage(applicationId: $applicationId, stageId: $stageId)
  }
`;

export const RESTORE_HISTORY = gql`
  ${APPLICATION_FIELDS}
  mutation RestoreHistory($applicationId: ID!, $sequence: Int!) {
    restoreHistory(applicationId: $applicationId, sequence: $sequence) {
      ...ApplicationFields
      interviewStages { id applicationId stageName stageOrder scheduledDate notes createdAt updatedAt }
    }
  }
`;
