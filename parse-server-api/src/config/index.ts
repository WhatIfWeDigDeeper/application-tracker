// Load environment variables from .env file in development
import { config as loadEnv } from 'dotenv';

// Only load .env in development (production should use actual env vars)
if (process.env.NODE_ENV !== 'production') {
  loadEnv();
}

// Validate schema name to prevent SQL injection
export function validateSchemaName(schema: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) {
    throw new Error(`Invalid schema name: ${schema}. Schema names must start with a letter or underscore and contain only alphanumeric characters and underscores.`);
  }
  return schema;
}

const schemaName = validateSchemaName(process.env.DATABASE_SCHEMA || 'vue_parse');
const baseDbUri = process.env.DATABASE_URL || 'postgres://parse_user:parse_password@localhost:5432/app_tracker';

// Add search_path option to ensure Parse Server uses the correct schema
// URL-encode the schema name for safe inclusion in connection string
const encodedSchema = encodeURIComponent(schemaName);
const databaseURI = baseDbUri.includes('?')
  ? `${baseDbUri}&options=-c search_path=${encodedSchema}`
  : `${baseDbUri}?options=-c search_path=${encodedSchema}`;

export const config = {
  databaseURI,
  schema: schemaName,
  appId: process.env.APP_ID || 'job-tracker-app',
  masterKey: process.env.MASTER_KEY || 'master-key-change-in-production',
  maintenanceKey: process.env.MAINTENANCE_KEY || 'maintenance-key-change-in-production',
  javascriptKey: process.env.JS_KEY || 'js-key-change-in-production',
  serverURL: process.env.SERVER_URL || 'http://localhost:5001/parse',
  port: parseInt(process.env.PORT || '5001', 10),
  mountPath: '/parse',
  allowClientClassCreation: false,
  enforcePrivateUsers: false,
};
