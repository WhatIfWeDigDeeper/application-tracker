import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_APPLICATION } from '../../graphql/mutations.js';
import { GET_APPLICATIONS } from '../../graphql/queries.js';
import { Button } from '../../components/ui/Button.js';
import type { ApplicationStatus } from '../../types/application.js';

export const Route = createFileRoute('/applications/new')({
  component: NewApplicationPage,
});

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function NewApplicationPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('wishlist');
  const [dateApplied, setDateApplied] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createApplication, { loading }] = useMutation(CREATE_APPLICATION, {
    refetchQueries: [GET_APPLICATIONS],
  });

  const doSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!positionTitle.trim()) newErrors.positionTitle = 'Position title is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      const result = await createApplication({
        variables: {
          input: {
            companyName: companyName.trim(),
            positionTitle: positionTitle.trim(),
            status,
            dateApplied: dateApplied || null,
            notes: notes || null,
          },
        },
      });
      const app = result.data?.createApplication;
      if (app) {
        navigate({ to: '/applications/$id', params: { id: app.id } });
      }
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to create application' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Application</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            data-testid="application-form-save"
            onClick={doSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Application'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate({ to: '/' })}
          >
            Cancel
          </Button>
        </div>
      </div>

      {errors.general && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded text-red-700 dark:text-red-300">
          {errors.general}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${errors.companyName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
        </div>

        <div>
          <label htmlFor="positionTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position Title *
          </label>
          <input
            id="positionTitle"
            type="text"
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder="Position Title"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${errors.positionTitle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {errors.positionTitle && <p className="mt-1 text-sm text-red-600">{errors.positionTitle}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateApplied" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Applied
            </label>
            <input
              id="dateApplied"
              type="date"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              disabled={status === 'wishlist'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>
      </div>
    </div>
  );
}
