import Parse from 'parse/node';
import { v4 as uuidv4 } from 'uuid';

// Application Status enum
const ApplicationStatus = [
  'applied',
  'rejected',
  'interviewing',
  'given offer',
  'accepted offer',
  'declined offer',
  'no offer',
] as const;

const CompanyCategory = [
  'education',
  'health',
  'climate',
  'ai',
  'energy',
  'finance',
  'enterprise-software',
  'consumer-tech',
  'e-commerce',
  'cybersecurity',
  'gaming',
  'media-entertainment',
  'consulting',
  'government',
  'nonprofit',
  'retail',
  'restaurant',
  'hospitality',
  'other',
] as const;

const JobSource = [
  'recruiter',
  'linkedin',
  'indeed',
  'friend',
  'colleague',
  'company-website',
  'other',
] as const;

// Validation helpers
function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `${fieldName} is required`);
  }
}

function validateMaxLength(value: string | undefined | null, maxLength: number, fieldName: string): void {
  if (value && value.length > maxLength) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `${fieldName} must be at most ${maxLength} characters`);
  }
}

function validateInArray<T>(value: T | undefined | null, array: readonly T[], fieldName: string): void {
  if (value !== undefined && value !== null && !array.includes(value)) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `${fieldName} must be one of: ${array.join(', ')}`);
  }
}

function validateRange(value: number | undefined | null, min: number, max: number, fieldName: string): void {
  if (value !== undefined && value !== null && (value < min || value > max)) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `${fieldName} must be between ${min} and ${max}`);
  }
}

function validateUrl(value: string | undefined | null, fieldName: string): void {
  if (value) {
    try {
      new URL(value);
    } catch {
      throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `${fieldName} must be a valid URL`);
    }
  }
}

// Before save hook for Application
Parse.Cloud.beforeSave('Application', async (request: Parse.Cloud.BeforeSaveRequest) => {
  const application = request.object;
  const isNew = !application.existed();

  // Generate UUID for new applications
  if (isNew && !application.get('uuid')) {
    application.set('uuid', uuidv4());
  }

  // Set default values for new applications
  if (isNew) {
    if (!application.get('dateApplied')) {
      application.set('dateApplied', new Date());
    }
    if (!application.get('status')) {
      application.set('status', 'applied');
    }
    if (application.get('isArchived') === undefined) {
      application.set('isArchived', false);
    }
  }

  // Validate required fields
  validateRequired(application.get('companyName'), 'companyName');
  validateRequired(application.get('positionTitle'), 'positionTitle');

  // Validate max lengths
  validateMaxLength(application.get('companyName'), 200, 'companyName');
  validateMaxLength(application.get('positionTitle'), 200, 'positionTitle');
  validateMaxLength(application.get('specialRequirements'), 1000, 'specialRequirements');
  validateMaxLength(application.get('notes'), 5000, 'notes');

  // Validate enum fields
  validateInArray(application.get('status'), ApplicationStatus, 'status');
  validateInArray(application.get('companyCategory'), CompanyCategory, 'companyCategory');
  validateInArray(application.get('jobSource'), JobSource, 'jobSource');

  // Validate numeric ranges
  validateRange(application.get('skillsMatch'), 1, 5, 'skillsMatch');
  if (application.get('salaryMin') !== undefined && application.get('salaryMin') < 0) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'salaryMin must be at least 0');
  }
  if (application.get('salaryMax') !== undefined && application.get('salaryMax') < 0) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'salaryMax must be at least 0');
  }

  // Validate URLs
  validateUrl(application.get('companyUrl'), 'companyUrl');
  validateUrl(application.get('jobPostingUrl'), 'jobPostingUrl');
  validateUrl(application.get('companyCareerUrl'), 'companyCareerUrl');
});

// After delete hook to clean up interview stages
Parse.Cloud.afterDelete('Application', async (request: Parse.Cloud.AfterDeleteRequest) => {
  const application = request.object;

  // Delete all related interview stages
  const stageQuery = new Parse.Query('InterviewStage');
  stageQuery.equalTo('applicationId', application.get('uuid'));
  const stages = await stageQuery.find({ useMasterKey: true });

  if (stages.length > 0) {
    await Parse.Object.destroyAll(stages, { useMasterKey: true });
  }
});

// Cloud function to list applications with filtering, sorting, and pagination
Parse.Cloud.define('listApplications', async (request: Parse.Cloud.FunctionRequest) => {
  const {
    status,
    companyCategory,
    jobSource,
    skillsMatchMin,
    includeArchived = false,
    sortBy = 'dateApplied',
    sortDir = 'desc',
    page = 1,
    limit = 20,
  } = request.params;

  const query = new Parse.Query('Application');

  // Filter by status (can be comma-separated)
  if (status) {
    const statuses = status.split(',').map((s: string) => s.trim());
    query.containedIn('status', statuses);
  }

  // Filter by company category
  if (companyCategory) {
    query.equalTo('companyCategory', companyCategory);
  }

  // Filter by job source
  if (jobSource) {
    query.equalTo('jobSource', jobSource);
  }

  // Filter by minimum skills match
  if (skillsMatchMin) {
    query.greaterThanOrEqualTo('skillsMatch', parseInt(skillsMatchMin, 10));
  }

  // Filter archived
  if (!includeArchived) {
    query.equalTo('isArchived', false);
  }

  // Apply sorting
  const sortField = sortBy === 'companyName' ? 'companyName' : sortBy === 'updatedAt' ? 'updatedAt' : 'dateApplied';
  if (sortDir === 'asc') {
    query.ascending(sortField);
  } else {
    query.descending(sortField);
  }

  // Get total count
  const total = await query.count({ useMasterKey: true });

  // Apply pagination
  const skip = (page - 1) * limit;
  query.skip(skip);
  query.limit(limit);

  // Execute query
  const applications = await query.find({ useMasterKey: true });

  // Get interview stages for all applications
  const applicationIds = applications.map((app: any) => app.get('uuid'));
  const stageQuery = new Parse.Query('InterviewStage');
  stageQuery.containedIn('applicationId', applicationIds);
  stageQuery.ascending('order');
  const allStages = await stageQuery.find({ useMasterKey: true });

  // Group stages by application
  const stagesByApp = new Map<string, any[]>();
  for (const stage of allStages) {
    const appId = stage.get('applicationId');
    if (!stagesByApp.has(appId)) {
      stagesByApp.set(appId, []);
    }
    stagesByApp.get(appId)!.push(stage);
  }

  // Format response
  const items = applications.map((app: any) => {
    const stages = stagesByApp.get(app.get('uuid')) || [];
    return formatApplication(app, stages);
  });

  return {
    items,
    page,
    limit,
    total,
  };
});

// Cloud function to get a single application
Parse.Cloud.define('getApplication', async (request: Parse.Cloud.FunctionRequest) => {
  const { id } = request.params;

  if (!id) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required');
  }

  const query = new Parse.Query('Application');
  query.equalTo('uuid', id);
  const application = await query.first({ useMasterKey: true });

  if (!application) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Application not found');
  }

  // Get interview stages
  const stageQuery = new Parse.Query('InterviewStage');
  stageQuery.equalTo('applicationId', id);
  stageQuery.ascending('order');
  const stages = await stageQuery.find({ useMasterKey: true });

  return formatApplication(application, stages);
});

// Cloud function to create an application
Parse.Cloud.define('createApplication', async (request: Parse.Cloud.FunctionRequest) => {
  const Application = Parse.Object.extend('Application');
  const application = new Application();

  const {
    companyName,
    positionTitle,
    dateApplied,
    companyUrl,
    jobPostingUrl,
    companyCareerUrl,
    companyCategory,
    skillsMatch,
    jobSource,
    coverLetterRequired,
    specialRequirements,
    salaryMin,
    salaryMax,
    notes,
  } = request.params;

  application.set('companyName', companyName);
  application.set('positionTitle', positionTitle);
  if (dateApplied) application.set('dateApplied', new Date(dateApplied));
  if (companyUrl !== undefined) application.set('companyUrl', companyUrl);
  if (jobPostingUrl !== undefined) application.set('jobPostingUrl', jobPostingUrl);
  if (companyCareerUrl !== undefined) application.set('companyCareerUrl', companyCareerUrl);
  if (companyCategory !== undefined) application.set('companyCategory', companyCategory);
  if (skillsMatch !== undefined) application.set('skillsMatch', skillsMatch);
  if (jobSource !== undefined) application.set('jobSource', jobSource);
  if (coverLetterRequired !== undefined) application.set('coverLetterRequired', coverLetterRequired);
  if (specialRequirements !== undefined) application.set('specialRequirements', specialRequirements);
  if (salaryMin !== undefined) application.set('salaryMin', salaryMin);
  if (salaryMax !== undefined) application.set('salaryMax', salaryMax);
  if (notes !== undefined) application.set('notes', notes);

  await application.save(null, { useMasterKey: true });

  return formatApplication(application, []);
});

// Cloud function to update an application
Parse.Cloud.define('updateApplication', async (request: Parse.Cloud.FunctionRequest) => {
  const { id, ...updates } = request.params;

  if (!id) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required');
  }

  const query = new Parse.Query('Application');
  query.equalTo('uuid', id);
  const application = await query.first({ useMasterKey: true });

  if (!application) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Application not found');
  }

  // Apply updates
  const allowedFields = [
    'companyName',
    'positionTitle',
    'dateApplied',
    'status',
    'companyUrl',
    'jobPostingUrl',
    'companyCareerUrl',
    'companyCategory',
    'skillsMatch',
    'jobSource',
    'coverLetterRequired',
    'specialRequirements',
    'salaryMin',
    'salaryMax',
    'notes',
    'offerDueDate',
  ];

  const dateFields = ['dateApplied', 'offerDueDate'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      // Convert date strings to Date objects
      if (dateFields.includes(field) && typeof updates[field] === 'string') {
        application.set(field, new Date(updates[field]));
      } else {
        application.set(field, updates[field]);
      }
    }
  }

  await application.save(null, { useMasterKey: true });

  // Get interview stages
  const stageQuery = new Parse.Query('InterviewStage');
  stageQuery.equalTo('applicationId', id);
  stageQuery.ascending('order');
  const stages = await stageQuery.find({ useMasterKey: true });

  return formatApplication(application, stages);
});

// Cloud function to delete an application
Parse.Cloud.define('deleteApplication', async (request: Parse.Cloud.FunctionRequest) => {
  const { id } = request.params;

  if (!id) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required');
  }

  const query = new Parse.Query('Application');
  query.equalTo('uuid', id);
  const application = await query.first({ useMasterKey: true });

  if (!application) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Application not found');
  }

  await application.destroy({ useMasterKey: true });

  return { success: true };
});

// Cloud function to archive an application
Parse.Cloud.define('archiveApplication', async (request: Parse.Cloud.FunctionRequest) => {
  const { id } = request.params;

  if (!id) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required');
  }

  const query = new Parse.Query('Application');
  query.equalTo('uuid', id);
  const application = await query.first({ useMasterKey: true });

  if (!application) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Application not found');
  }

  application.set('isArchived', true);
  await application.save(null, { useMasterKey: true });

  // Get interview stages
  const stageQuery = new Parse.Query('InterviewStage');
  stageQuery.equalTo('applicationId', id);
  stageQuery.ascending('order');
  const stages = await stageQuery.find({ useMasterKey: true });

  return formatApplication(application, stages);
});

// Cloud function to restore an application
Parse.Cloud.define('restoreApplication', async (request: Parse.Cloud.FunctionRequest) => {
  const { id } = request.params;

  if (!id) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'id is required');
  }

  const query = new Parse.Query('Application');
  query.equalTo('uuid', id);
  const application = await query.first({ useMasterKey: true });

  if (!application) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Application not found');
  }

  application.set('isArchived', false);
  await application.save(null, { useMasterKey: true });

  // Get interview stages
  const stageQuery = new Parse.Query('InterviewStage');
  stageQuery.equalTo('applicationId', id);
  stageQuery.ascending('order');
  const stages = await stageQuery.find({ useMasterKey: true });

  return formatApplication(application, stages);
});

// Helper function to format application for API response
function formatApplication(application: any, stages: any[]) {
  const dateApplied = application.get('dateApplied');
  const offerDueDate = application.get('offerDueDate');

  return {
    id: application.get('uuid'),
    companyName: application.get('companyName'),
    positionTitle: application.get('positionTitle'),
    dateApplied: dateApplied instanceof Date ? dateApplied.toISOString().split('T')[0] : dateApplied,
    status: application.get('status'),
    createdAt: application.createdAt?.toISOString(),
    updatedAt: application.updatedAt?.toISOString(),
    companyUrl: application.get('companyUrl') || null,
    jobPostingUrl: application.get('jobPostingUrl') || null,
    companyCareerUrl: application.get('companyCareerUrl') || null,
    companyCategory: application.get('companyCategory') || null,
    skillsMatch: application.get('skillsMatch') || null,
    jobSource: application.get('jobSource') || null,
    coverLetterRequired: application.get('coverLetterRequired') || null,
    specialRequirements: application.get('specialRequirements') || null,
    salaryMin: application.get('salaryMin') || null,
    salaryMax: application.get('salaryMax') || null,
    notes: application.get('notes') || null,
    offerDueDate: offerDueDate instanceof Date ? offerDueDate.toISOString().split('T')[0] : offerDueDate,
    isArchived: application.get('isArchived'),
    interviewStages: stages.map(formatInterviewStage),
  };
}

function formatInterviewStage(stage: any) {
  const completedDate = stage.get('completedDate');

  return {
    id: stage.get('uuid'),
    name: stage.get('name'),
    order: stage.get('order'),
    isCompleted: stage.get('isCompleted'),
    completedDate: completedDate instanceof Date ? completedDate.toISOString().split('T')[0] : completedDate,
    notes: stage.get('notes') || null,
    performanceRating: stage.get('performanceRating') || null,
  };
}
