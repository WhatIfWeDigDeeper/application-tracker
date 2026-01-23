import express from 'express';
import cors from 'cors';
import ParseServerModule from 'parse-server';
import { config } from './config';
import { Client } from 'pg';

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check endpoint (non-Parse)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Create Parse Server instance
const parseServer = new (ParseServerModule as any)({
  databaseURI: config.databaseURI,
  appId: config.appId,
  masterKey: config.masterKey,
  maintenanceKey: config.maintenanceKey,
  javascriptKey: config.javascriptKey,
  serverURL: config.serverURL,
  cloud: `${__dirname}/cloud/index`,
  allowClientClassCreation: config.allowClientClassCreation,
  enforcePrivateUsers: config.enforcePrivateUsers,
});

// Mount Parse Server
app.use(config.mountPath, parseServer.app);

// Initialize Parse schemas
async function initializeSchemas() {
  const Parse = require('parse/node');
  Parse.initialize(config.appId, config.javascriptKey, config.masterKey);
  Parse.serverURL = config.serverURL;

  // Give Parse Server a moment to fully start up
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Define Application schema
  // Note: Parse Server automatically provides: objectId, createdAt, updatedAt
  try {
    const applicationSchema = new Parse.Schema('Application');

    // Try to fetch existing schema first
    try {
      await applicationSchema.get();
      console.log('Application schema exists, will update if needed');

      // Update the schema to ensure Date fields are properly registered
      applicationSchema
        .addString('companyName')
        .addString('positionTitle')
        .addDate('dateApplied')
        .addString('status')
        .addString('companyUrl')
        .addString('jobPostingUrl')
        .addString('companyCareerUrl')
        .addString('companyCategory')
        .addNumber('skillsMatch')
        .addString('jobSource')
        .addBoolean('coverLetterRequired')
        .addString('specialRequirements')
        .addNumber('salaryMin')
        .addNumber('salaryMax')
        .addString('notes')
        .addDate('offerDueDate')
        .addBoolean('isArchived');

      await applicationSchema.update();
      console.log('Application schema updated');
    } catch (fetchError: any) {
      // Schema doesn't exist, create it
      applicationSchema
        .addString('companyName')
        .addString('positionTitle')
        .addDate('dateApplied')
        .addString('status')
        .addString('companyUrl')
        .addString('jobPostingUrl')
        .addString('companyCareerUrl')
        .addString('companyCategory')
        .addNumber('skillsMatch')
        .addString('jobSource')
        .addBoolean('coverLetterRequired')
        .addString('specialRequirements')
        .addNumber('salaryMin')
        .addNumber('salaryMax')
        .addString('notes')
        .addDate('offerDueDate')
        .addBoolean('isArchived')
        .addIndex('status_index', { status: 1 })
        .addIndex('isArchived_index', { isArchived: 1 })
        .addIndex('dateApplied_index', { dateApplied: -1 });

      await applicationSchema.save();
      console.log('Application schema created');
    }
  } catch (error: any) {
    console.error('Error with Application schema:', error);
    throw error;
  }

  // Define InterviewStage schema
  try {
    const stageSchema = new Parse.Schema('InterviewStage');

    try {
      await stageSchema.get();
      console.log('InterviewStage schema exists, will update if needed');

      stageSchema
        .addString('applicationId')
        .addString('name')
        .addNumber('order')
        .addBoolean('isCompleted')
        .addDate('completedDate')
        .addString('notes')
        .addNumber('performanceRating');

      await stageSchema.update();
      console.log('InterviewStage schema updated');
    } catch (fetchError: any) {
      stageSchema
        .addString('applicationId')
        .addString('name')
        .addNumber('order')
        .addBoolean('isCompleted')
        .addDate('completedDate')
        .addString('notes')
        .addNumber('performanceRating')
        .addIndex('applicationId_index', { applicationId: 1 })
        .addIndex('app_order_index', { applicationId: 1, order: 1 });

      await stageSchema.save();
      console.log('InterviewStage schema created');
    }
  } catch (error: any) {
    console.error('Error with InterviewStage schema:', error);
    throw error;
  }
}

// Ensure database schema is set up
async function ensureSchemaSetup() {
  const client = new Client({
    connectionString: config.databaseURI,
  });

  try {
    await client.connect();

    // Ensure the schema exists (using identifier to safely quote)
    await client.query('CREATE SCHEMA IF NOT EXISTS ' + client.escapeIdentifier(config.schema));
    console.log(`Schema ${config.schema} is ready`);

    // Create tables directly using SQL to avoid Parse SDK caching issues
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${client.escapeIdentifier(config.schema)}."Application" (
        "objectId" TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "companyName" TEXT,
        "positionTitle" TEXT,
        "dateApplied" TIMESTAMP WITH TIME ZONE,
        "status" TEXT,
        "companyUrl" TEXT,
        "jobPostingUrl" TEXT,
        "companyCareerUrl" TEXT,
        "companyCategory" TEXT,
        "skillsMatch" DOUBLE PRECISION,
        "jobSource" TEXT,
        "coverLetterRequired" BOOLEAN,
        "specialRequirements" TEXT,
        "salaryMin" DOUBLE PRECISION,
        "salaryMax" DOUBLE PRECISION,
        "notes" TEXT,
        "offerDueDate" TIMESTAMP WITH TIME ZONE,
        "isArchived" BOOLEAN,
        "_rperm" TEXT[],
        "_wperm" TEXT[]
      );

      CREATE INDEX IF NOT EXISTS "Application_status_idx" ON ${client.escapeIdentifier(config.schema)}."Application"("status");
      CREATE INDEX IF NOT EXISTS "Application_isArchived_idx" ON ${client.escapeIdentifier(config.schema)}."Application"("isArchived");
      CREATE INDEX IF NOT EXISTS "Application_dateApplied_idx" ON ${client.escapeIdentifier(config.schema)}."Application"("dateApplied");
    `);
    console.log('Application table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${client.escapeIdentifier(config.schema)}."InterviewStage" (
        "objectId" TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "applicationId" TEXT,
        "name" TEXT,
        "order" DOUBLE PRECISION,
        "isCompleted" BOOLEAN,
        "completedDate" TIMESTAMP WITH TIME ZONE,
        "notes" TEXT,
        "performanceRating" DOUBLE PRECISION,
        "_rperm" TEXT[],
        "_wperm" TEXT[]
      );

      CREATE INDEX IF NOT EXISTS "InterviewStage_applicationId_idx" ON ${client.escapeIdentifier(config.schema)}."InterviewStage"("applicationId");
      CREATE INDEX IF NOT EXISTS "InterviewStage_app_order_idx" ON ${client.escapeIdentifier(config.schema)}."InterviewStage"("applicationId", "order");
    `);
    console.log('InterviewStage table created');

    await client.end();
  } catch (error) {
    console.error('Failed to set up database schema:', error);
    throw error;
  }
}

// Start server
async function start() {
  // Ensure schema setup before starting Parse Server
  await ensureSchemaSetup();

  await parseServer.start();

  app.listen(config.port, async () => {
    console.log(`Parse Server running on port ${config.port}`);
    console.log(`Parse API available at ${config.serverURL}`);

    // Initialize Parse Server schemas to register proper field types in _SCHEMA
    try {
      await initializeSchemas();
    } catch (error) {
      console.error('Failed to initialize schemas:', error);
    }
  });
}

start().catch(console.error);
