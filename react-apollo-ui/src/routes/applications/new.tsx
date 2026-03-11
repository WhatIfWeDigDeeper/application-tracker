import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_APPLICATION, CREATE_STAGE } from '../../graphql/mutations.js';
import { GET_APPLICATIONS } from '../../graphql/queries.js';
import { Button } from '../../components/ui/Button.js';
import { StarRating } from '../../components/ui/StarRating.js';
import {
  type ApplicationStatus, type CompanyCategory, type JobSource,
  STATUS_LABELS, CATEGORY_LABELS, SOURCE_LABELS, COMPANY_CATEGORIES, JOB_SOURCES,
  toApiStatus, toApiCategory, toApiSource,
} from '../../types/application.js';

export const Route = createFileRoute('/applications/new')({
  component: NewApplicationPage,
});

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'unsubmitted', label: STATUS_LABELS.unsubmitted },
  { value: 'applied', label: STATUS_LABELS.applied },
  { value: 'interviewing', label: STATUS_LABELS.interviewing },
  { value: 'given offer', label: STATUS_LABELS['given offer'] },
  { value: 'accepted offer', label: STATUS_LABELS['accepted offer'] },
  { value: 'declined offer', label: STATUS_LABELS['declined offer'] },
  { value: 'rejected', label: STATUS_LABELS.rejected },
  { value: 'no offer', label: STATUS_LABELS['no offer'] },
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
  const [offerDueDate, setOfferDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Interview stages state
  const [pendingStages, setPendingStages] = useState<Array<{ name: string; order: number }>>([]);
  const [showStageForm, setShowStageForm] = useState(false);
  const [stageForm, setStageForm] = useState({ name: '', order: '0' });

  const [createApplication, { loading }] = useMutation(CREATE_APPLICATION, {
    refetchQueries: [GET_APPLICATIONS],
  });
  const [createStage] = useMutation(CREATE_STAGE);

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

    const minVal = salaryMin ? parseInt(salaryMin, 10) : null;
    const maxVal = salaryMax ? parseInt(salaryMax, 10) : null;
    if (minVal != null && maxVal != null && minVal > maxVal) {
      newErrors.salary = 'Minimum salary must not exceed maximum';
    }

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
            status: toApiStatus(status) as unknown as ApplicationStatus,
            dateApplied: dateApplied || null,
            companyUrl: companyUrl || null,
            jobPostingUrl: jobPostingUrl || null,
            companyCareerUrl: companyCareerUrl || null,
            companyCategory: companyCategory ? (toApiCategory(companyCategory) as unknown as CompanyCategory) : null,
            jobSource: jobSource ? (toApiSource(jobSource) as unknown as JobSource) : null,
            skillsMatch: skillsMatch ? parseInt(skillsMatch, 10) : null,
            coverLetterRequired,
            specialRequirements: specialRequirements || null,
            salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
            salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
            notes: notes || null,
            offerDueDate: offerDueDate || null,
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const app = (result.data as any)?.createApplication;
      if (app) {
        for (const stage of pendingStages) {
          await createStage({
            variables: {
              applicationId: app.id,
              input: { name: stage.name, order: stage.order, notes: null },
            },
          });
        }
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
            Back to List
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

        {status === 'given offer' && (
          <div>
            <label htmlFor="offerDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Offer Due Date
            </label>
            <input
              id="offerDueDate"
              type="date"
              value={offerDueDate}
              onChange={(e) => setOfferDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skills Match
            </label>
            <StarRating value={skillsMatch} onChange={setSkillsMatch} />
          </div>
        </div>

        {errors.salary && (
          <p className="text-sm text-red-600">{errors.salary}</p>
        )}

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

      {/* Interview Stages */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Interview Stages</h2>
          <button
            type="button"
            onClick={() => {
              setShowStageForm(true);
              setStageForm({ name: '', order: String(pendingStages.length) });
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Stage
          </button>
        </div>

        {showStageForm && (
          <form className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 mb-3" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Stage Name *</label>
              <input
                type="text"
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder="Phone Screen, Technical Interview..."
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStageForm(false)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!stageForm.name.trim()) return;
                  setPendingStages((prev) => [
                    ...prev,
                    { name: stageForm.name.trim(), order: prev.length },
                  ]);
                  setShowStageForm(false);
                  setStageForm({ name: '', order: '0' });
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Stage
              </button>
            </div>
          </form>
        )}

        {pendingStages.length === 0 && !showStageForm && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">No interview stages added yet.</p>
        )}

        <div className="space-y-2">
          {pendingStages.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <span className="font-medium text-sm">{s.name}</span>
              <span className="text-xs text-gray-500">#{s.order}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
