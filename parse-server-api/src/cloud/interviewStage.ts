import Parse from 'parse/node';
import { v4 as uuidv4 } from 'uuid';

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

function validateRange(value: number | undefined | null, min: number, max: number, fieldName: string): void {
  if (value !== undefined && value !== null && (value < min || value > max)) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `${fieldName} must be between ${min} and ${max}`);
  }
}

// Before save hook for InterviewStage
Parse.Cloud.beforeSave('InterviewStage', async (request: Parse.Cloud.BeforeSaveRequest) => {
  const stage = request.object;
  const isNew = !stage.existed();

  // Generate UUID for new stages
  if (isNew && !stage.get('uuid')) {
    stage.set('uuid', uuidv4());
  }

  // Set default values
  if (isNew && stage.get('isCompleted') === undefined) {
    stage.set('isCompleted', false);
  }

  // Validate required fields
  validateRequired(stage.get('name'), 'name');
  validateRequired(stage.get('applicationId'), 'applicationId');
  if (stage.get('order') === undefined || stage.get('order') === null) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'order is required');
  }

  // Validate max lengths
  validateMaxLength(stage.get('name'), 100, 'name');
  validateMaxLength(stage.get('notes'), 2000, 'notes');

  // Validate numeric ranges
  if (stage.get('order') < 0) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'order must be at least 0');
  }
  validateRange(stage.get('performanceRating'), 1, 5, 'performanceRating');

  // Verify the application exists
  if (isNew) {
    const appQuery = new Parse.Query('Application');
    appQuery.equalTo('uuid', stage.get('applicationId'));
    const application = await appQuery.first({ useMasterKey: true });
    if (!application) {
      throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Application not found');
    }
  }
});

// Cloud function to create an interview stage
Parse.Cloud.define('createInterviewStage', async (request: Parse.Cloud.FunctionRequest) => {
  const { applicationId, name, order, isCompleted, completedDate, notes, performanceRating } = request.params;

  if (!applicationId) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'applicationId is required');
  }

  // Verify application exists
  const appQuery = new Parse.Query('Application');
  appQuery.equalTo('uuid', applicationId);
  const application = await appQuery.first({ useMasterKey: true });

  if (!application) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Application not found');
  }

  const InterviewStage = Parse.Object.extend('InterviewStage');
  const stage = new InterviewStage();

  stage.set('applicationId', applicationId);
  stage.set('name', name);
  stage.set('order', order);
  if (isCompleted !== undefined) stage.set('isCompleted', isCompleted);
  if (completedDate !== undefined) stage.set('completedDate', new Date(completedDate));
  if (notes !== undefined) stage.set('notes', notes);
  if (performanceRating !== undefined) stage.set('performanceRating', performanceRating);

  await stage.save(null, { useMasterKey: true });

  return formatInterviewStage(stage);
});

// Cloud function to update an interview stage
Parse.Cloud.define('updateInterviewStage', async (request: Parse.Cloud.FunctionRequest) => {
  const { applicationId, stageId, ...updates } = request.params;

  if (!applicationId || !stageId) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'applicationId and stageId are required');
  }

  const query = new Parse.Query('InterviewStage');
  query.equalTo('uuid', stageId);
  query.equalTo('applicationId', applicationId);
  const stage = await query.first({ useMasterKey: true });

  if (!stage) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Interview stage not found');
  }

  // Apply updates
  const allowedFields = ['name', 'order', 'isCompleted', 'completedDate', 'notes', 'performanceRating'];
  const dateFields = ['completedDate'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      // Convert date strings to Date objects
      if (dateFields.includes(field) && typeof updates[field] === 'string') {
        stage.set(field, new Date(updates[field]));
      } else {
        stage.set(field, updates[field]);
      }
    }
  }

  await stage.save(null, { useMasterKey: true });

  return formatInterviewStage(stage);
});

// Cloud function to delete an interview stage
Parse.Cloud.define('deleteInterviewStage', async (request: Parse.Cloud.FunctionRequest) => {
  const { applicationId, stageId } = request.params;

  if (!applicationId || !stageId) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'applicationId and stageId are required');
  }

  const query = new Parse.Query('InterviewStage');
  query.equalTo('uuid', stageId);
  query.equalTo('applicationId', applicationId);
  const stage = await query.first({ useMasterKey: true });

  if (!stage) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Interview stage not found');
  }

  await stage.destroy({ useMasterKey: true });

  return { success: true };
});

// Helper function to format interview stage for API response
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
