/**
 * Tests for useApplications hook
 * Requires MSW to be installed: npm install --save-dev msw
 */

// Check if MSW is available - skip entire file if not
let mswAvailable = false;
try {
  require('msw');
  mswAvailable = true;
} catch {
  // MSW not installed
}

if (!mswAvailable) {
  describe('useApplications', () => {
    it.skip('requires MSW to be installed', () => {});
  });
} else {
  // Only load dependencies if MSW is available
  const { renderHook, act, waitFor } = require('@testing-library/react');
  const { useApplications } = require('./useApplications');
  const { resetMockApplications, createMockApplication } = require('../test-utils/mocks/handlers');
  const { server } = require('../test-utils/mocks/server');

  describe('useApplications', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
    afterEach(() => {
      server.resetHandlers();
      resetMockApplications([]);
    });
    afterAll(() => server.close());

    describe('loading state', () => {
      it('starts in loading state', () => {
        const { result } = renderHook(() => useApplications());
        expect(result.current.isLoading).toBe(true);
      });

      it('finishes loading after fetch', async () => {
        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe('fetching applications', () => {
      it('returns empty array when no applications exist', async () => {
        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.applications).toEqual([]);
      });

      it('returns applications from API', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'Company A' }),
          createMockApplication({ companyName: 'Company B' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(2);
        });

        expect(result.current.applications[0]?.companyName).toBe('Company A');
      });
    });

    describe('filtering', () => {
      it('excludes archived applications by default', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'Active', isArchived: false }),
          createMockApplication({ companyName: 'Archived', isArchived: true }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
        });

        expect(result.current.applications[0]?.companyName).toBe('Active');
      });

      it('includes archived applications when filter is set', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'Active', isArchived: false }),
          createMockApplication({ companyName: 'Archived', isArchived: true }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        act(() => {
          result.current.setFilters({ includeArchived: true });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(2);
        });
      });

      it('filters by status', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'Applied', status: 'applied' }),
          createMockApplication({ companyName: 'Interviewing', status: 'interviewing' }),
          createMockApplication({ companyName: 'Offered', status: 'given offer' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        act(() => {
          result.current.setFilters({ status: ['interviewing'] });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
          expect(result.current.applications[0]?.companyName).toBe('Interviewing');
        });
      });

      it('filters by multiple statuses', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'Applied', status: 'applied' }),
          createMockApplication({ companyName: 'Interviewing', status: 'interviewing' }),
          createMockApplication({ companyName: 'Rejected', status: 'rejected' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        act(() => {
          result.current.setFilters({ status: ['applied', 'interviewing'] });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(2);
        });
      });

      it('filters by company category', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'AI Co', companyCategory: 'ai' }),
          createMockApplication({ companyName: 'Fintech Co', companyCategory: 'fintech' }),
          createMockApplication({ companyName: 'No Category' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        act(() => {
          result.current.setFilters({ companyCategory: ['ai'] });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
          expect(result.current.applications[0]?.companyName).toBe('AI Co');
        });
      });

      it('filters by job source', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'LinkedIn', jobSource: 'linkedin' }),
          createMockApplication({ companyName: 'Referral', jobSource: 'referral' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        act(() => {
          result.current.setFilters({ jobSource: ['linkedin'] });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
          expect(result.current.applications[0]?.companyName).toBe('LinkedIn');
        });
      });

      it('filters by minimum skills match', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'High Match', skillsMatch: 5 }),
          createMockApplication({ companyName: 'Low Match', skillsMatch: 2 }),
          createMockApplication({ companyName: 'No Match' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        act(() => {
          result.current.setFilters({ skillsMatchMin: 4 });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
          expect(result.current.applications[0]?.companyName).toBe('High Match');
        });
      });
    });

    describe('sorting', () => {
      it('sorts by date applied descending by default', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'Older', dateApplied: '2026-01-01' }),
          createMockApplication({ companyName: 'Newer', dateApplied: '2026-01-15' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(2);
        });

        expect(result.current.applications[0]?.companyName).toBe('Newer');
        expect(result.current.applications[1]?.companyName).toBe('Older');
      });

      it('sorts by company name ascending', async () => {
        const mockApps = [
          createMockApplication({ companyName: 'Zebra Corp' }),
          createMockApplication({ companyName: 'Alpha Inc' }),
        ];
        resetMockApplications(mockApps);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        act(() => {
          result.current.setSort({ field: 'companyName', direction: 'asc' });
        });

        await waitFor(() => {
          expect(result.current.applications[0]?.companyName).toBe('Alpha Inc');
          expect(result.current.applications[1]?.companyName).toBe('Zebra Corp');
        });
      });
    });

    describe('CRUD operations', () => {
      it('adds a new application', async () => {
        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          await result.current.addApplication({
            companyName: 'New Company',
            positionTitle: 'Developer',
          });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
          expect(result.current.applications[0]?.companyName).toBe('New Company');
        });
      });

      it('updates an application', async () => {
        const mockApp = createMockApplication({ companyName: 'Original' });
        resetMockApplications([mockApp]);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
        });

        await act(async () => {
          await result.current.updateApplication(mockApp.id, { companyName: 'Updated' });
        });

        await waitFor(() => {
          expect(result.current.applications[0]?.companyName).toBe('Updated');
        });
      });

      it('deletes an application', async () => {
        const mockApp = createMockApplication({ companyName: 'To Delete' });
        resetMockApplications([mockApp]);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
        });

        await act(async () => {
          await result.current.deleteApplication(mockApp.id);
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(0);
        });
      });

      it('archives an application', async () => {
        const mockApp = createMockApplication({ companyName: 'To Archive', isArchived: false });
        resetMockApplications([mockApp]);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
        });

        await act(async () => {
          await result.current.archiveApplication(mockApp.id);
        });

        // Archived apps are hidden by default
        await waitFor(() => {
          expect(result.current.applications).toHaveLength(0);
        });
      });

      it('restores an archived application', async () => {
        const mockApp = createMockApplication({ companyName: 'Archived', isArchived: true });
        resetMockApplications([mockApp]);

        const { result } = renderHook(() => useApplications());

        // Set filters to include archived
        act(() => {
          result.current.setFilters({ includeArchived: true });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
        });

        await act(async () => {
          await result.current.restoreApplication(mockApp.id);
        });

        // Now show only non-archived
        act(() => {
          result.current.setFilters({ includeArchived: false });
        });

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
          expect(result.current.applications[0]?.isArchived).toBe(false);
        });
      });
    });

    describe('getApplicationById', () => {
      it('returns application by id', async () => {
        const mockApp = createMockApplication({ companyName: 'Find Me' });
        resetMockApplications([mockApp]);

        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.applications).toHaveLength(1);
        });

        const found = result.current.getApplicationById(mockApp.id);
        expect(found?.companyName).toBe('Find Me');
      });

      it('returns null for non-existent id', async () => {
        const { result } = renderHook(() => useApplications());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        const found = result.current.getApplicationById('non-existent');
        expect(found).toBeNull();
      });
    });
  });
}
