import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_APPLICATION } from '../../graphql/mutations.js';
import { GET_APPLICATIONS } from '../../graphql/queries.js';
import { Button } from '../../components/ui/Button.js';
import {
  type ApplicationStatus, type CompanyCategory, type JobSource,
  STATUS_LABELS, CATEGORY_LABELS, SOURCE_LABELS, COMPANY_CATEGORIES, JOB_SOURCES,
} from '../../types/application.js';

export const Route = createFileRoute('/applications/new')({
  component: NewApplicationPage,
});

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'unsubmitted', label: STATUS_LABELS.unsubmitted },
  { value: 'applied', label: STATUS_LABELS.applied },
  { value: 'interviewing', label: STATUS_LABELS.interviewing },
  { value: 'given_offer', label: STATUS_LABELS.given_offer },
  { value: 'accepted_offer', label: STATUS_LABELS.accepted_offer },
  { value: 'declined_offer', label: STATUS_LABELS.declined_offer },
  { value: 'rejected', label: STATUS_LABELS.rejected },
  { value: 'no_offer', label: STATUS_LABELS.no_offer },
];

function NewApplicationPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('unsubmitted');
  const [dateApplied, setDateApplied] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [jobPostingUrl, setJobPostingUrl] = useState('');
  const [companyCareerUrl, setCompanyCareerUrl] = useState('');
  const [companyCategory, setCompanyCategory] = useState<CompanyCategory | ''>('');
  const [jobSource, setJobSource] = useState<JobSource | ''>('');
  const [skillsMatch, setSkillsMatch] = useState('');
  const [coverLetterRequired, setCoverLetterRequired] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createApplication, { loading }] = useMutation(CREATE_APPLICATION, {
    refetchQueries: [GET_APPLICATIONS],
  });

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setStatus(newStatus);
    if (newStatus === 'unsubmitted') {
      setDateApplied('');
    } else if (status === 'unsubmitted' && !dateApplied) {
      const today = new Date().toISOString().split('T')[0];
      setDateApplied(today);
    }
  };

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
            companyUrl: companyUrl || null,
            jobPostingUrl: jobPostingUrl || null,
            companyCareerUrl: companyCareerUrl || null,
            companyCategory: companyCategory || null,
            jobSource: jobSource || null,
            skillsMatch: skillsMatch ? parseInt(skillsMatch, 10) : null,
            coverLetterRequired,
            specialRequirements: specialRequirements || null,
            salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
            salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
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

  const inputClass = (field?: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${field && errors[field] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`;

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
            placeholder="Company Name *"
            className={inputClass('companyName')}
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
            placeholder="Position Title *"
            className={inputClass('positionTitle')}
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
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
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
              disabled={status === 'unsubmitted'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label htmlFor="jobPostingUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Posting URL
          </label>
          <input
            id="jobPostingUrl"
            type="url"
            value={jobPostingUrl}
            onChange={(e) => setJobPostingUrl(e.target.value)}
            placeholder="https://linkedin.com/jobs/..."
            className={inputClass()}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company URL
            </label>
            <input
              id="companyUrl"
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://example.com"
              className={inputClass()}
            />
          </div>
          <div>
            <label htmlFor="companyCareerUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Career URL
            </label>
            <input
              id="companyCareerUrl"
              type="url"
              value={companyCareerUrl}
              onChange={(e) => setCompanyCareerUrl(e.target.value)}
              placeholder="https://example.com/careers"
              className={inputClass()}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Category
            </label>
            <select
              id="companyCategory"
              value={companyCategory}
              onChange={(e) => setCompanyCategory(e.target.value as CompanyCategory | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {COMPANY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="jobSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Source
            </label>
            <select
              id="jobSource"
              value={jobSource}
              onChange={(e) => setJobSource(e.target.value as JobSource | '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select source</option>
              {JOB_SOURCES.map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Salary
            </label>
            <input
              id="salaryMin"
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Salary
            </label>
            <input
              id="salaryMax"
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label htmlFor="skillsMatch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skills Match
            </label>
            <input
              id="skillsMatch"
              type="number"
              min="1"
              max="5"
              value={skillsMatch}
              onChange={(e) => setSkillsMatch(e.target.value)}
              className={inputClass()}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={coverLetterRequired}
              onChange={(e) => setCoverLetterRequired(e.target.checked)}
              className="w-4 h-4"
            />
            cover letter required
          </label>
        </div>

        <div>
          <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Special Requirements
          </label>
          <textarea
            id="specialRequirements"
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
            maxLength={1000}
            rows={3}
            className={`${inputClass()} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={5000}
            rows={3}
            className={`${inputClass()} resize-y`}
          />
        </div>
      </div>
    </div>
  );
}
