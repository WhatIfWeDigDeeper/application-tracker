import { http, HttpResponse } from 'msw';
import type { JobApplication } from '@/types/application';

const API_URL = 'http://localhost:3001';

// Mock data factory
export function createMockApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    companyName: 'Test Company',
    positionTitle: 'Software Engineer',
    dateApplied: '2026-01-15',
    status: 'applied',
    isArchived: false,
    interviewStages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// In-memory store for tests
let mockApplications: JobApplication[] = [];

export function resetMockApplications(apps: JobApplication[] = []): void {
  mockApplications = apps;
}

export function getMockApplications(): JobApplication[] {
  return mockApplications;
}

// MSW handlers
export const handlers = [
  // List applications
  http.get(`${API_URL}/applications`, () => {
    return HttpResponse.json({
      items: mockApplications,
      page: 1,
      limit: 20,
      total: mockApplications.length,
    });
  }),

  // Get single application
  http.get(`${API_URL}/applications/:id`, ({ params }) => {
    const app = mockApplications.find((a) => a.id === params.id);
    if (!app) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Application not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(app);
  }),

  // Create application
  http.post(`${API_URL}/applications`, async ({ request }) => {
    const body = await request.json() as Partial<JobApplication>;
    const newApp = createMockApplication({
      ...body,
      status: 'unsubmitted',
    });
    mockApplications.push(newApp);
    return HttpResponse.json(newApp, { status: 201 });
  }),

  // Update application
  http.patch(`${API_URL}/applications/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<JobApplication>;
    const existing = mockApplications.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Application not found' },
        { status: 404 }
      );
    }
    const updated: JobApplication = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    const index = mockApplications.indexOf(existing);
    mockApplications[index] = updated;
    return HttpResponse.json(updated);
  }),

  // Delete application
  http.delete(`${API_URL}/applications/:id`, ({ params }) => {
    const index = mockApplications.findIndex((a) => a.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Application not found' },
        { status: 404 }
      );
    }
    mockApplications.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Archive application
  http.post(`${API_URL}/applications/:id/archive`, ({ params }) => {
    const existing = mockApplications.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Application not found' },
        { status: 404 }
      );
    }
    const updated: JobApplication = {
      ...existing,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    };
    const index = mockApplications.indexOf(existing);
    mockApplications[index] = updated;
    return HttpResponse.json(updated);
  }),

  // Restore application
  http.post(`${API_URL}/applications/:id/restore`, ({ params }) => {
    const existing = mockApplications.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Application not found' },
        { status: 404 }
      );
    }
    const updated: JobApplication = {
      ...existing,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };
    const index = mockApplications.indexOf(existing);
    mockApplications[index] = updated;
    return HttpResponse.json(updated);
  }),

  // Interview stages
  http.get(`${API_URL}/applications/:id/interview-stages`, ({ params }) => {
    const app = mockApplications.find((a) => a.id === params.id);
    if (!app) {
      return HttpResponse.json(
        { error: 'not_found', message: 'Application not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(app.interviewStages);
  }),
];
