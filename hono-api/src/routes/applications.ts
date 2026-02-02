import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  ListApplicationsQuerySchema,
  CreateInterviewStageSchema,
  UpdateInterviewStageSchema,
} from '../types/api.js';
import * as applicationService from '../services/application.service.js';
import * as interviewStageService from '../services/interview-stage.service.js';

const applications = new Hono();

// List applications
applications.get('/', zValidator('query', ListApplicationsQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');
    const result = await applicationService.listApplications(query);
    return c.json(result);
  } catch (error) {
    console.error('Error listing applications:', error);
    return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
  }
});

// Get single application
applications.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const app = await applicationService.getApplication(id);

    if (!app) {
      return c.json({ code: 'not_found', message: 'Application not found' }, 404);
    }

    return c.json(app);
  } catch (error) {
    console.error('Error getting application:', error);
    return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
  }
});

// Create application
applications.post('/', zValidator('json', CreateApplicationSchema), async (c) => {
  try {
    const input = c.req.valid('json');
    const app = await applicationService.createApplication(input);
    return c.json(app, 201);
  } catch (error) {
    console.error('Error creating application:', error);
    return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
  }
});

// Update application
applications.patch(
  '/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', UpdateApplicationSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const app = await applicationService.updateApplication(id, input);

      if (!app) {
        return c.json({ code: 'not_found', message: 'Application not found' }, 404);
      }

      return c.json(app);
    } catch (error) {
      console.error('Error updating application:', error);
      return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
    }
  }
);

// Delete application
applications.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const deleted = await applicationService.deleteApplication(id);

    if (!deleted) {
      return c.json({ code: 'not_found', message: 'Application not found' }, 404);
    }

    return c.body(null, 204);
  } catch (error) {
    console.error('Error deleting application:', error);
    return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
  }
});

// Archive application
applications.post('/:id/archive', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const app = await applicationService.archiveApplication(id);

    if (!app) {
      return c.json({ code: 'not_found', message: 'Application not found' }, 404);
    }

    return c.json(app);
  } catch (error) {
    console.error('Error archiving application:', error);
    return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
  }
});

// Restore application
applications.post('/:id/restore', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const app = await applicationService.restoreApplication(id);

    if (!app) {
      return c.json({ code: 'not_found', message: 'Application not found' }, 404);
    }

    return c.json(app);
  } catch (error) {
    console.error('Error restoring application:', error);
    return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
  }
});

// Create interview stage
applications.post(
  '/:id/interview-stages',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', CreateInterviewStageSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const input = c.req.valid('json');
      const stage = await interviewStageService.createInterviewStage(id, input);

      if (!stage) {
        return c.json({ code: 'not_found', message: 'Application not found' }, 404);
      }

      return c.json(stage, 201);
    } catch (error) {
      console.error('Error creating interview stage:', error);
      return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
    }
  }
);

// Update interview stage
applications.patch(
  '/:id/interview-stages/:stageId',
  zValidator('param', z.object({ id: z.string().uuid(), stageId: z.string().uuid() })),
  zValidator('json', UpdateInterviewStageSchema),
  async (c) => {
    try {
      const { id, stageId } = c.req.valid('param');
      const input = c.req.valid('json');
      const stage = await interviewStageService.updateInterviewStage(id, stageId, input);

      if (!stage) {
        return c.json({ code: 'not_found', message: 'Interview stage not found' }, 404);
      }

      return c.json(stage);
    } catch (error) {
      console.error('Error updating interview stage:', error);
      return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
    }
  }
);

// Delete interview stage
applications.delete(
  '/:id/interview-stages/:stageId',
  zValidator('param', z.object({ id: z.string().uuid(), stageId: z.string().uuid() })),
  async (c) => {
    try {
      const { id, stageId } = c.req.valid('param');
      const deleted = await interviewStageService.deleteInterviewStage(id, stageId);

      if (!deleted) {
        return c.json({ code: 'not_found', message: 'Interview stage not found' }, 404);
      }

      return c.body(null, 204);
    } catch (error) {
      console.error('Error deleting interview stage:', error);
      return c.json({ code: 'internal_error', message: 'An unexpected error occurred' }, 500);
    }
  }
);

export default applications;
