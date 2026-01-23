// Load .env file manually
import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envPath = resolve(process.cwd(), '.env');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (error) {
  // .env file is optional
}

export const config = {
  // Use dedicated parse_user with search_path set to vue_parse schema
  databaseURI: process.env.DATABASE_URL || 'postgres://parse_user:parse_password@localhost:5432/app_tracker',
  schema: process.env.DATABASE_SCHEMA || 'vue_parse',
  appId: process.env.APP_ID || 'job-tracker-app',
  masterKey: process.env.MASTER_KEY || 'master-key-change-in-production',
  javascriptKey: process.env.JS_KEY || 'js-key-change-in-production',
  serverURL: process.env.SERVER_URL || 'http://localhost:5001/parse',
  port: parseInt(process.env.PORT || '5001', 10),
  mountPath: '/parse',
  allowClientClassCreation: false,
  enforcePrivateUsers: false,
};
