// Import all cloud functions
import Parse from 'parse/node';
import './application';
import './interviewStage';

// Health check endpoint
Parse.Cloud.define('health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
});
